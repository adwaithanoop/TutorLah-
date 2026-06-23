-- Wallets hold the single source of truth for a member's balance. The balance is
-- only ever moved by the definer functions below, never by a direct client write,
-- so a student cannot mint funds and a tutor cannot release escrow early.

create type wallet_txn_kind as enum (
  'topup',
  'escrow_hold',
  'escrow_release',
  'escrow_refund'
);

create type topup_status as enum ('pending', 'completed');

create table wallets (
  id uuid primary key references profiles (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- Append only ledger. Every balance change writes one signed row here, so the
-- balance always reconciles to the sum of a wallet's transactions.
create table wallet_transactions (
  id uuid primary key default gen_random_uuid (),
  wallet_id uuid not null references wallets (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  kind wallet_txn_kind not null,
  amount numeric(12, 2) not null check (amount <> 0),
  created_at timestamptz not null default now()
);

create index wallet_transactions_wallet_idx on wallet_transactions (wallet_id, created_at desc);

-- One row per Stripe Checkout Session. The session id is the idempotency key: a
-- replayed webhook can credit the wallet at most once.
create table wallet_topups (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references profiles (id) on delete cascade,
  stripe_session_id text not null unique,
  amount numeric(12, 2) not null check (amount > 0),
  status topup_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index wallet_topups_user_idx on wallet_topups (user_id, created_at desc);

alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table wallet_topups enable row level security;

-- The schema default grants every privilege to authenticated, so writes have to be
-- explicitly pulled back. Members may read their own money records and nothing else;
-- all writes flow through the definer functions or the service role.
revoke insert, update, delete on wallets from anon, authenticated;
revoke insert, update, delete on wallet_transactions from anon, authenticated;
revoke insert, update, delete on wallet_topups from anon, authenticated;

create policy "read own wallet" on wallets for
select
  to authenticated using (auth.uid () = id);

create policy "read own ledger" on wallet_transactions for
select
  to authenticated using (auth.uid () = wallet_id);

create policy "read own topups" on wallet_topups for
select
  to authenticated using (auth.uid () = user_id);

-- Credits a wallet once a Stripe Checkout Session is paid. Locking the topup row and
-- short circuiting on a completed status makes the webhook safe to retry.
create function credit_topup (p_session_id text) returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_topup wallet_topups;
begin
  select * into v_topup from wallet_topups where stripe_session_id = p_session_id for update;
  if not found then
    raise exception 'Top-up not found for session %', p_session_id;
  end if;
  if v_topup.status = 'completed' then
    return;
  end if;

  insert into wallets (id) values (v_topup.user_id) on conflict (id) do nothing;
  update wallets set balance = balance + v_topup.amount, updated_at = now() where id = v_topup.user_id;
  insert into wallet_transactions (wallet_id, kind, amount)
  values (v_topup.user_id, 'topup', v_topup.amount);

  update wallet_topups set status = 'completed', completed_at = now() where id = v_topup.id;
end;
$$;

-- Moves the booking amount from the student's wallet into escrow. The wallet row is
-- locked for the balance check so two concurrent bookings cannot spend it twice.
create function pay_booking (p_booking uuid) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
  v_balance numeric(12, 2);
begin
  select * into v_booking from bookings where id = p_booking for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking.escrow_state <> 'pending_payment' then
    raise exception 'Booking is not awaiting payment';
  end if;

  insert into wallets (id) values (v_booking.student_id) on conflict (id) do nothing;
  select balance into v_balance from wallets where id = v_booking.student_id for update;
  if v_balance < v_booking.amount then
    raise exception 'Insufficient wallet balance' using errcode = 'check_violation';
  end if;

  update wallets set balance = balance - v_booking.amount, updated_at = now()
  where id = v_booking.student_id;
  insert into wallet_transactions (wallet_id, booking_id, kind, amount)
  values (v_booking.student_id, p_booking, 'escrow_hold', -v_booking.amount);

  update bookings set escrow_state = 'held' where id = p_booking returning * into v_booking;
  return v_booking;
end;
$$;

-- Releases escrow to the tutor. The report gate and the time-lock are enforced here
-- against the database clock so neither can be bypassed from the client.
create function complete_booking (p_booking uuid) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
begin
  select * into v_booking from bookings where id = p_booking for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking.escrow_state <> 'held' then
    raise exception 'Booking is not in escrow';
  end if;
  if not v_booking.report_submitted then
    raise exception 'Submit the session report before completing';
  end if;
  if now() < v_booking.scheduled_end then
    raise exception 'Cannot complete before the session ends';
  end if;

  insert into wallets (id) values (v_booking.tutor_id) on conflict (id) do nothing;
  update wallets set balance = balance + v_booking.amount, updated_at = now()
  where id = v_booking.tutor_id;
  insert into wallet_transactions (wallet_id, booking_id, kind, amount)
  values (v_booking.tutor_id, p_booking, 'escrow_release', v_booking.amount);

  update bookings set escrow_state = 'released' where id = p_booking returning * into v_booking;
  return v_booking;
end;
$$;

-- Returns escrowed funds to the student.
create function refund_booking (p_booking uuid) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
begin
  select * into v_booking from bookings where id = p_booking for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking.escrow_state <> 'held' then
    raise exception 'Booking is not in escrow';
  end if;

  update wallets set balance = balance + v_booking.amount, updated_at = now()
  where id = v_booking.student_id;
  insert into wallet_transactions (wallet_id, booking_id, kind, amount)
  values (v_booking.student_id, p_booking, 'escrow_refund', v_booking.amount);

  update bookings set escrow_state = 'refunded' where id = p_booking returning * into v_booking;
  return v_booking;
end;
$$;

-- These functions move money, so they are only ever called by the server through the
-- service role after it has authorized the caller. Pulling execute back from members
-- stops a signed-in user from invoking them directly and skipping that check.
revoke execute on function credit_topup (text) from anon, authenticated;
revoke execute on function pay_booking (uuid) from anon, authenticated;
revoke execute on function complete_booking (uuid) from anon, authenticated;
revoke execute on function refund_booking (uuid) from anon, authenticated;

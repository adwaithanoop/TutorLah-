-- Group enrolment becomes a paid action. Until now enrol_in_group recorded the price a
-- student would pay and nothing more, so a seat cost nothing. The seat, the wallet debit
-- and the ledger line now happen in one transaction under the same session lock, so a
-- student holds a seat if and only if their money is held for it.

-- A group seat has no bookings row, so the ledger needs its own link back to the enrolment
-- the hold or refund belongs to.
alter table wallet_transactions
add column group_enrolment_id uuid references group_enrolments (id) on delete set null;

-- Track each enrolment's escrow through the same states a booking uses. Rows created
-- before this migration never paid anything, so they are marked unpaid rather than held;
-- a refund must never credit money that was never collected.
alter table group_enrolments
add column escrow_state text not null default 'held' check (escrow_state in ('unpaid', 'held', 'released', 'refunded'));

update group_enrolments
set escrow_state = 'unpaid';

-- Same seat guards as before, then the charge mirrors confirm_booking_internal: ensure a
-- wallet row, lock it, check the balance and write the signed hold. A duplicate enrolment
-- still trips the unique constraint and rolls the whole transaction back, debit included.
create or replace function enrol_in_group (p_group uuid) returns numeric
language plpgsql
security definer
set search_path = public as $$
declare
  g group_sessions;
  n int;
  price numeric;
  v_balance numeric(12, 2);
  v_enrolment uuid;
begin
  select * into g from group_sessions where id = p_group for update;
  if not found then raise exception 'Group session not found'; end if;
  if g.status <> 'open' then raise exception 'Group session is closed' using errcode = 'check_violation'; end if;

  select count(*) into n from group_enrolments where group_session_id = p_group;
  if n >= g.max_participants then raise exception 'Group session is full' using errcode = 'check_violation'; end if;

  price := round(greatest(g.floor_per_student, g.total_cost / (n + 1)), 2);

  insert into wallets (id) values (auth.uid()) on conflict (id) do nothing;
  select balance into v_balance from wallets where id = auth.uid() for update;
  if v_balance < price then
    raise exception 'Insufficient wallet balance' using errcode = 'check_violation';
  end if;

  insert into group_enrolments (group_session_id, student_id, price_charged)
  values (p_group, auth.uid(), price)
  returning id into v_enrolment;

  update wallets set balance = balance - price, updated_at = now() where id = auth.uid();
  insert into wallet_transactions (wallet_id, group_enrolment_id, kind, amount)
  values (auth.uid(), v_enrolment, 'escrow_hold', -price);
  return price;
end;
$$;

-- The function checks the caller itself through auth.uid(), so it stays member facing,
-- same as before the replace.
revoke execute on function enrol_in_group (uuid) from public, anon;

grant execute on function enrol_in_group (uuid) to authenticated;

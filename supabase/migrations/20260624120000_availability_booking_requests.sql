-- Availability-driven booking. Students send booking requests against a tutor's
-- published weekly availability; a request only becomes a paid booking when the tutor
-- accepts (or the student accepts a counter-offer). Every transition that moves money
-- runs in a definer function the client cannot call directly, and the price is always
-- derived here from the tutor's rate, never trusted from the request payload.

create extension if not exists btree_gist;

-- A tutor can never hold two overlapping sessions. Half-open ranges keep back-to-back
-- sessions (4-6, 6-8) legal; cancelled and refunded bookings free their slot again.
-- This is the real double-booking guard: it holds even under a concurrent race.
alter table bookings
  add constraint bookings_no_tutor_overlap
  exclude using gist (
    tutor_id with =,
    tstzrange (scheduled_start, scheduled_end, '[)') with &&
  )
  where (escrow_state not in ('cancelled', 'refunded'));

-- Repeating weekly availability. weekday is 0 (Sunday) through 6 (Saturday) in the
-- Singapore wall clock; minutes count from local midnight (0..1440). Each block is one
-- bookable window sized for a single session: between 1 and 2 hours, on the half-hour
-- grid. A tutor free for a long stretch adds adjacent blocks, which merge back into one
-- continuous bookable window; this keeps them thinking in session-sized pieces instead
-- of marking a whole afternoon as one slot.
create table availability_blocks (
  id uuid primary key default gen_random_uuid (),
  profile_id uuid not null references profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_minute integer not null check (start_minute between 0 and 1440),
  end_minute integer not null check (end_minute between 0 and 1440),
  created_at timestamptz not null default now(),
  check (start_minute % 30 = 0 and end_minute % 30 = 0),
  check (end_minute - start_minute between 60 and 120)
);

create index availability_blocks_profile_idx on availability_blocks (profile_id);

create type booking_request_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'expired',
  'superseded',
  'countered'
);

create table booking_requests (
  id uuid primary key default gen_random_uuid (),
  student_id uuid not null references profiles (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  amount numeric(8, 2) not null check (amount > 0),
  status booking_request_status not null default 'pending',
  expires_at timestamptz not null,
  booking_id uuid references bookings (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (scheduled_end > scheduled_start),
  check (student_id <> tutor_id)
);

create index booking_requests_student_idx on booking_requests (student_id, created_at desc);
create index booking_requests_tutor_idx on booking_requests (tutor_id, created_at desc);

-- The only rows the expiry sweep ever scans, so it stays cheap no matter how large the
-- history grows; the same predicate also blocks duplicate live requests.
create index booking_requests_pending_idx on booking_requests (expires_at)
where
  status = 'pending';

create unique index booking_requests_one_live on booking_requests (student_id, tutor_id, scheduled_start)
where
  status = 'pending';

create type counter_offer_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table counter_offers (
  id uuid primary key default gen_random_uuid (),
  request_id uuid not null references booking_requests (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  amount numeric(8, 2) not null check (amount > 0),
  status counter_offer_status not null default 'pending',
  expires_at timestamptz not null,
  booking_id uuid references bookings (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index counter_offers_student_idx on counter_offers (student_id, created_at desc);

create index counter_offers_pending_idx on counter_offers (expires_at)
where
  status = 'pending';

-- The exact alternative slots a tutor offered. A student can only confirm one of these,
-- so the times a counter booking lands on are never taken from the client payload.
create table counter_offer_slots (
  id uuid primary key default gen_random_uuid (),
  offer_id uuid not null references counter_offers (id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  check (scheduled_end > scheduled_start)
);

create index counter_offer_slots_offer_idx on counter_offer_slots (offer_id);

alter table availability_blocks enable row level security;
alter table booking_requests enable row level security;
alter table counter_offers enable row level security;
alter table counter_offer_slots enable row level security;

-- Members never write these tables directly. Availability is the one exception: a tutor
-- manages their own blocks, mirroring how the existing availability table works.
revoke insert, update, delete on booking_requests from anon, authenticated;
revoke insert, update, delete on counter_offers from anon, authenticated;
revoke insert, update, delete on counter_offer_slots from anon, authenticated;

create policy "blocks readable by nus" on availability_blocks for
select
  to authenticated using (is_nus ());

create policy "tutor manages own blocks" on availability_blocks for all to authenticated using (auth.uid () = profile_id)
with
  check (auth.uid () = profile_id);

create policy "requests readable by parties" on booking_requests for
select
  to authenticated using (
    is_nus () and (auth.uid () = student_id or auth.uid () = tutor_id)
  );

create policy "counter offers readable by parties" on counter_offers for
select
  to authenticated using (
    is_nus () and (auth.uid () = student_id or auth.uid () = tutor_id)
  );

create policy "counter slots readable by offer parties" on counter_offer_slots for
select
  to authenticated using (
    exists (
      select
        1
      from
        counter_offers o
      where
        o.id = offer_id
        and (auth.uid () = o.student_id or auth.uid () = o.tutor_id)
    )
  );

-- True only when [p_start, p_end) sits wholly inside one of the profile's weekly blocks,
-- evaluated in the Singapore wall clock. Used to validate every requested and offered
-- slot server-side so a client cannot book a time the tutor never published.
create function availability_covers (p_profile uuid, p_start timestamptz, p_end timestamptz) returns boolean
language sql
stable
security definer
set search_path = public as $$
  with local as (
    select
      extract(dow from (p_start at time zone 'Asia/Singapore'))::int as weekday,
      (extract(hour from (p_start at time zone 'Asia/Singapore')) * 60
        + extract(minute from (p_start at time zone 'Asia/Singapore')))::int as start_min,
      (extract(epoch from (p_end - p_start)) / 60)::int as duration_min
  )
  select exists (
    select 1
    from availability_blocks b, local l
    where b.profile_id = p_profile
      and b.weekday = l.weekday
      and b.start_minute <= l.start_min
      and b.end_minute >= l.start_min + l.duration_min
  );
$$;

-- Creates one pending request. p_student is the authenticated caller, passed by the
-- server after it has verified the session; the price is computed here from the tutor's
-- published rate, so the student can never influence what they will be charged.
create function request_booking (
  p_student uuid,
  p_tutor uuid,
  p_module text,
  p_start timestamptz,
  p_end timestamptz
) returns booking_requests
language plpgsql
security definer
set search_path = public as $$
declare
  v_request booking_requests;
  v_rate numeric(6, 2);
  v_active boolean;
  v_minutes int := (extract(epoch from (p_end - p_start)) / 60)::int;
  v_amount numeric(8, 2);
begin
  if p_student = p_tutor then
    raise exception 'You cannot book yourself' using errcode = 'check_violation';
  end if;
  if p_start <= now() then
    raise exception 'That time has already passed' using errcode = 'check_violation';
  end if;
  if v_minutes not in (60, 90, 120) then
    raise exception 'Sessions must be 1, 1.5 or 2 hours' using errcode = 'check_violation';
  end if;
  if extract(minute from (p_start at time zone 'Asia/Singapore'))::int % 30 <> 0 then
    raise exception 'Start time must fall on a half hour' using errcode = 'check_violation';
  end if;

  select rate_per_hour, is_active into v_rate, v_active from profiles where id = p_tutor;
  if not found then
    raise exception 'Tutor not found';
  end if;
  if not coalesce(v_active, false) then
    raise exception 'This tutor is not accepting bookings' using errcode = 'check_violation';
  end if;
  if not (v_rate > 0) then
    raise exception 'This tutor has not set a rate yet' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from tutor_modules
    where tutor_id = p_tutor and module_code = p_module and is_verified
  ) then
    raise exception 'This tutor does not teach that module' using errcode = 'check_violation';
  end if;
  if not availability_covers(p_tutor, p_start, p_end) then
    raise exception 'That slot is outside the tutor''s availability' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from bookings
    where tutor_id = p_tutor
      and escrow_state not in ('cancelled', 'refunded')
      and tstzrange(scheduled_start, scheduled_end, '[)') && tstzrange(p_start, p_end, '[)')
  ) then
    raise exception 'That slot is already booked' using errcode = 'check_violation';
  end if;

  v_amount := round(v_rate * v_minutes / 60.0, 2);

  begin
    insert into booking_requests (student_id, tutor_id, module_code, scheduled_start, scheduled_end, amount, expires_at)
    values (p_student, p_tutor, p_module, p_start, p_end, v_amount, now() + interval '2 hours')
    returning * into v_request;
  exception
    when unique_violation then
      raise exception 'You already have a pending request for that slot' using errcode = 'check_violation';
  end;
  return v_request;
end;
$$;

-- Shared escrow move: charge the student and open the held booking in one locked step.
-- The wallet row is locked for the balance check so two concurrent confirmations cannot
-- spend it twice, and the no-overlap constraint turns a raced double-book into a clean
-- error rather than two sessions.
create function confirm_booking_internal (
  p_student uuid,
  p_tutor uuid,
  p_module text,
  p_start timestamptz,
  p_end timestamptz,
  p_amount numeric
) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
  v_balance numeric(12, 2);
begin
  insert into wallets (id) values (p_student) on conflict (id) do nothing;
  select balance into v_balance from wallets where id = p_student for update;
  if v_balance < p_amount then
    raise exception 'Insufficient wallet balance' using errcode = 'check_violation';
  end if;

  begin
    insert into bookings (student_id, tutor_id, module_code, scheduled_start, scheduled_end, price_type, amount, escrow_state)
    values (p_student, p_tutor, p_module, p_start, p_end, 'fixed', p_amount, 'held')
    returning * into v_booking;
  exception
    when exclusion_violation then
      raise exception 'That slot was just taken, pick another' using errcode = 'check_violation';
  end;

  update wallets set balance = balance - p_amount, updated_at = now() where id = p_student;
  insert into wallet_transactions (wallet_id, booking_id, kind, amount)
  values (p_student, v_booking.id, 'escrow_hold', -p_amount);
  return v_booking;
end;
$$;

-- Cancels the student's competing requests once one of their sessions is locked in:
-- other requests for the same module (they wanted one), anything overlapping the booked
-- time (they cannot be in two places), and any pending counter-offer for that module.
create function prune_after_booking (
  p_keep uuid,
  p_student uuid,
  p_tutor uuid,
  p_module text,
  p_start timestamptz,
  p_end timestamptz
) returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_range tstzrange := tstzrange(p_start, p_end, '[)');
begin
  update booking_requests
  set status = 'superseded', resolved_at = now()
  where status = 'pending'
    and id is distinct from p_keep
    and (
      (student_id = p_student and module_code = p_module)
      or (student_id = p_student and tstzrange(scheduled_start, scheduled_end, '[)') && v_range)
      or (tutor_id = p_tutor and tstzrange(scheduled_start, scheduled_end, '[)') && v_range)
    );

  update counter_offers
  set status = 'cancelled', resolved_at = now()
  where status = 'pending'
    and student_id = p_student
    and module_code = p_module;
end;
$$;

-- Tutor accepts a request. p_tutor is the authenticated caller; it must own the request.
create function accept_booking_request (p_tutor uuid, p_request uuid) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_req booking_requests;
  v_booking bookings;
begin
  select * into v_req from booking_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.tutor_id <> p_tutor then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_req.status <> 'pending' or v_req.expires_at <= now() then
    raise exception 'This request is no longer open' using errcode = 'check_violation';
  end if;

  v_booking := confirm_booking_internal(
    v_req.student_id, v_req.tutor_id, v_req.module_code,
    v_req.scheduled_start, v_req.scheduled_end, v_req.amount
  );

  update booking_requests
  set status = 'accepted', resolved_at = now(), booking_id = v_booking.id
  where id = p_request;

  perform prune_after_booking(
    p_request, v_req.student_id, v_req.tutor_id, v_req.module_code,
    v_req.scheduled_start, v_req.scheduled_end
  );
  return v_booking;
end;
$$;

-- Tutor declines a request.
create function decline_booking_request (p_tutor uuid, p_request uuid) returns booking_requests
language plpgsql
security definer
set search_path = public as $$
declare
  v_req booking_requests;
begin
  select * into v_req from booking_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.tutor_id <> p_tutor then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request is no longer open' using errcode = 'check_violation';
  end if;

  update booking_requests set status = 'declined', resolved_at = now()
  where id = p_request returning * into v_req;
  return v_req;
end;
$$;

-- Student cancels their own pending request.
create function cancel_booking_request (p_student uuid, p_request uuid) returns booking_requests
language plpgsql
security definer
set search_path = public as $$
declare
  v_req booking_requests;
begin
  select * into v_req from booking_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.student_id <> p_student then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request can no longer be cancelled' using errcode = 'check_violation';
  end if;

  update booking_requests set status = 'cancelled', resolved_at = now()
  where id = p_request returning * into v_req;
  return v_req;
end;
$$;

-- Tutor counters with alternative slots they have published. p_slots is a JSON array of
-- {start, end} pairs; each is re-validated against the tutor's availability and existing
-- bookings here, and must keep the original duration so the price stays fixed.
create function counter_propose (p_tutor uuid, p_request uuid, p_slots jsonb) returns counter_offers
language plpgsql
security definer
set search_path = public as $$
declare
  v_req booking_requests;
  v_offer counter_offers;
  v_start timestamptz;
  v_end timestamptz;
  v_count int := 0;
  v_duration int;
  v_slot jsonb;
begin
  select * into v_req from booking_requests where id = p_request for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.tutor_id <> p_tutor then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request is no longer open' using errcode = 'check_violation';
  end if;

  v_duration := (extract(epoch from (v_req.scheduled_end - v_req.scheduled_start)) / 60)::int;

  insert into counter_offers (request_id, student_id, tutor_id, module_code, amount, expires_at)
  values (p_request, v_req.student_id, v_req.tutor_id, v_req.module_code, v_req.amount, now() + interval '2 hours')
  returning * into v_offer;

  for v_slot in select * from jsonb_array_elements(p_slots) loop
    v_start := (v_slot ->> 'start')::timestamptz;
    v_end := (v_slot ->> 'end')::timestamptz;
    if v_start <= now() then
      raise exception 'Offered times must be in the future' using errcode = 'check_violation';
    end if;
    if (extract(epoch from (v_end - v_start)) / 60)::int <> v_duration then
      raise exception 'Offered slots must keep the same length' using errcode = 'check_violation';
    end if;
    if not availability_covers(p_tutor, v_start, v_end) then
      raise exception 'An offered slot is outside your availability' using errcode = 'check_violation';
    end if;
    if exists (
      select 1 from bookings
      where tutor_id = p_tutor
        and escrow_state not in ('cancelled', 'refunded')
        and tstzrange(scheduled_start, scheduled_end, '[)') && tstzrange(v_start, v_end, '[)')
    ) then
      raise exception 'An offered slot clashes with another session' using errcode = 'check_violation';
    end if;
    insert into counter_offer_slots (offer_id, scheduled_start, scheduled_end)
    values (v_offer.id, v_start, v_end);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'Offer at least one alternative slot' using errcode = 'check_violation';
  end if;

  update booking_requests set status = 'countered', resolved_at = now() where id = p_request;
  return v_offer;
end;
$$;

-- Student confirms one of the offered slots. The chosen time must be one the tutor
-- actually offered, so the booking time can never be forged from the client.
create function accept_counter_offer (
  p_student uuid,
  p_offer uuid,
  p_start timestamptz,
  p_end timestamptz
) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_offer counter_offers;
  v_booking bookings;
begin
  select * into v_offer from counter_offers where id = p_offer for update;
  if not found then
    raise exception 'Offer not found';
  end if;
  if v_offer.student_id <> p_student then
    raise exception 'Not your offer' using errcode = '42501';
  end if;
  if v_offer.status <> 'pending' or v_offer.expires_at <= now() then
    raise exception 'This offer has expired' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from counter_offer_slots
    where offer_id = p_offer and scheduled_start = p_start and scheduled_end = p_end
  ) then
    raise exception 'Pick one of the offered times' using errcode = 'check_violation';
  end if;

  v_booking := confirm_booking_internal(
    v_offer.student_id, v_offer.tutor_id, v_offer.module_code, p_start, p_end, v_offer.amount
  );

  update counter_offers set status = 'accepted', resolved_at = now(), booking_id = v_booking.id
  where id = p_offer;

  perform prune_after_booking(
    null, v_offer.student_id, v_offer.tutor_id, v_offer.module_code, p_start, p_end
  );
  return v_booking;
end;
$$;

-- Materialises expiry for the sweeper. Correctness already comes from the read filters
-- (a request past its deadline is never shown or actionable); this just tidies state and
-- lets notifications fire. Service role only.
create function expire_stale_requests () returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_requests int;
  v_offers int;
begin
  update booking_requests set status = 'expired', resolved_at = now()
  where status = 'pending' and expires_at <= now();
  get diagnostics v_requests = row_count;

  update counter_offers set status = 'expired', resolved_at = now()
  where status = 'pending' and expires_at <= now();
  get diagnostics v_offers = row_count;

  return v_requests + v_offers;
end;
$$;

-- All of the above move money or state and are only ever reached through the server's
-- service role after it has authorised the caller. Pulling execute back from members
-- stops a signed-in user invoking them directly and skipping that check.
revoke execute on function availability_covers (uuid, timestamptz, timestamptz) from anon, authenticated;
revoke execute on function request_booking (uuid, uuid, text, timestamptz, timestamptz) from anon, authenticated;
revoke execute on function confirm_booking_internal (uuid, uuid, text, timestamptz, timestamptz, numeric) from anon, authenticated;
revoke execute on function prune_after_booking (uuid, uuid, uuid, text, timestamptz, timestamptz) from anon, authenticated;
revoke execute on function accept_booking_request (uuid, uuid) from anon, authenticated;
revoke execute on function decline_booking_request (uuid, uuid) from anon, authenticated;
revoke execute on function cancel_booking_request (uuid, uuid) from anon, authenticated;
revoke execute on function counter_propose (uuid, uuid, jsonb) from anon, authenticated;
revoke execute on function accept_counter_offer (uuid, uuid, timestamptz, timestamptz) from anon, authenticated;
revoke execute on function expire_stale_requests () from anon, authenticated;

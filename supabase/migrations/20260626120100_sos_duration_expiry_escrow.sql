-- SOS requests gain a student-chosen length and a 20 minute lifetime, and bids now carry
-- the total a tutor will charge for that whole session rather than an hourly rate.
-- Accepting a bid holds the total in escrow through the shared booking helper, so an SOS
-- match produces a paid, scheduled booking exactly like an availability booking does.

alter table sos_requests
  add column duration_minutes smallint,
  add column expires_at timestamptz;

-- Existing rows predate both columns: base their deadline on when they were posted so the
-- sweep retires anything already stale, and give them the smallest valid length.
update sos_requests
set duration_minutes = 60,
    expires_at = created_at + interval '20 minutes'
where duration_minutes is null;

alter table sos_requests
  alter column duration_minutes set not null,
  alter column expires_at set not null,
  alter column expires_at set default now() + interval '20 minutes',
  add constraint sos_requests_duration_check check (duration_minutes in (60, 90, 120, 150, 180));

-- The only rows the expiry sweep scans, kept cheap as history grows.
create index sos_requests_open_idx on sos_requests (expires_at)
where
  status = 'open';

-- A bid is the whole-session price now, not a per-hour rate.
alter table sos_bids
rename column rate to amount;

-- Hold the accepted total in escrow and open the session as a real booking. The bid total
-- is charged through the shared helper, which locks the wallet, checks the balance and
-- writes the escrow ledger, so accepting an SOS bid behaves like confirming any booking.
-- The session runs from the moment of acceptance for the length the student fixed.
create or replace function accept_sos_bid (p_request uuid, p_bid uuid) returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  v_request sos_requests;
  v_bid sos_bids;
  v_booking bookings;
begin
  select * into v_request from sos_requests where id = p_request for update;
  if not found then raise exception 'SOS request not found'; end if;
  if v_request.student_id <> auth.uid() then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_request.status <> 'open' or v_request.expires_at <= now() then
    raise exception 'Request is no longer open' using errcode = 'check_violation';
  end if;

  select * into v_bid from sos_bids where id = p_bid and request_id = p_request;
  if not found then raise exception 'Bid not found'; end if;

  v_booking := confirm_booking_internal(
    v_request.student_id, v_bid.tutor_id, v_request.module_code,
    now(), now() + make_interval(mins => v_request.duration_minutes), v_bid.amount
  );

  update sos_bids set status = 'accepted' where id = p_bid;
  update sos_bids set status = 'rejected'
    where request_id = p_request and id <> p_bid and status = 'pending';
  update sos_requests set status = 'matched' where id = p_request;

  return v_booking.id;
end;
$$;

-- Extend the sweep so a passed SOS window is retired too. As with booking requests the read
-- filters already hide expired rows; this just materialises the state so the feed and the
-- notifications stay consistent.
create or replace function expire_stale_requests () returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_requests int;
  v_offers int;
  v_sos int;
begin
  update booking_requests set status = 'expired', resolved_at = now()
  where status = 'pending' and expires_at <= now();
  get diagnostics v_requests = row_count;

  update counter_offers set status = 'expired', resolved_at = now()
  where status = 'pending' and expires_at <= now();
  get diagnostics v_offers = row_count;

  update sos_requests set status = 'expired'
  where status = 'open' and expires_at <= now();
  get diagnostics v_sos = row_count;

  return v_requests + v_offers + v_sos;
end;
$$;

-- Harden the client-facing inserts. A student cannot mint a never-expiring request: the
-- window is fixed by the column default and may never be pushed beyond 20 minutes. A tutor
-- can only bid on a request that is still open and unexpired, and only on a module they are
-- verified for, closing the gap where a direct insert bypassed the API's own checks.
drop policy "students create own sos" on sos_requests;

create policy "students create own sos" on sos_requests for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = student_id
    and expires_at > now()
    and expires_at <= now() + interval '20 minutes'
  );

drop policy "tutors create own bids" on sos_bids;

create policy "tutors create own bids" on sos_bids for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = tutor_id
    and exists (
      select
        1
      from
        sos_requests r
        join tutor_modules tm on tm.module_code = r.module_code
      where
        r.id = request_id
        and r.status = 'open'
        and r.expires_at > now()
        and tm.tutor_id = auth.uid ()
        and tm.is_verified
    )
  );

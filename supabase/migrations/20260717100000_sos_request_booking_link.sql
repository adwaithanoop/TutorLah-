-- Accepting an SOS bid already opens a real escrowed booking, but the request never
-- remembered which one, so the SOS page had no way to lead the student into the
-- booking-keyed review flow once the session finished. Store the booking on the request
-- at the moment it is matched. Requests matched before this migration keep a null
-- booking_id and simply show no prompt; their bookings stay reviewable from the
-- bookings page as before.
alter table sos_requests
add column booking_id uuid unique references bookings (id);

drop policy "students create own sos" on sos_requests;

create policy "students create own sos" on sos_requests for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = student_id
    and status = 'open'
    and booking_id is null
    and expires_at > now()
    and expires_at <= now() + interval '20 minutes'
  );

drop policy "sos cancellable by owner" on sos_requests;

create policy "sos cancellable by owner" on sos_requests
for update
  to authenticated using (auth.uid () = student_id)
with
  check (
    auth.uid () = student_id
    and status in ('open', 'cancelled')
    and booking_id is null
  );

drop policy "student writes own review" on reviews;

create policy "student writes own review" on reviews for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = student_id
    and exists (
      select
        1
      from
        bookings b
      where
        b.id = booking_id
        and b.student_id = auth.uid ()
        and b.student_id = reviews.student_id
        and b.tutor_id = reviews.tutor_id
        and b.escrow_state = 'released'
    )
  );

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
  update sos_requests set status = 'matched', booking_id = v_booking.id where id = p_request;

  return v_booking.id;
end;
$$;

-- Replacing the function keeps its access list, but restate the grants so they stay
-- visible next to the definition they protect.
revoke execute on function accept_sos_bid (uuid, uuid) from public, anon;

grant execute on function accept_sos_bid (uuid, uuid) to authenticated;

alter publication supabase_realtime
add table bookings;

alter publication supabase_realtime
add table reviews;

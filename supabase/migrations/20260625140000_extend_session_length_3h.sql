-- Allow sessions up to 3 hours, in half-hour steps (60, 90, 120, 150, 180 minutes).
-- Availability blocks grow to match, so a tutor can open a single 3 hour window instead
-- of stitching two adjacent blocks together.

alter table availability_blocks drop constraint availability_blocks_check1;

alter table availability_blocks
  add constraint availability_blocks_duration_check
  check (end_minute - start_minute between 60 and 180);

create or replace function request_booking (
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
  if v_minutes not in (60, 90, 120, 150, 180) then
    raise exception 'Sessions must be 1, 1.5, 2, 2.5 or 3 hours' using errcode = 'check_violation';
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

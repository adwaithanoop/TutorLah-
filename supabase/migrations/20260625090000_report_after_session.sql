-- A session report is a write-up of a session that happened, so it can only be submitted
-- once the session has actually ended, judged by the database clock and never by anything
-- the client claims. Routing report submission through this definer function, and revoking
-- direct inserts, makes that gate impossible to bypass, exactly as booking confirmation and
-- completion are gated.
create function submit_session_report (
  p_tutor uuid,
  p_booking uuid,
  p_misconceptions text,
  p_summary text
) returns session_reports
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
  v_report session_reports;
begin
  select * into v_booking from bookings where id = p_booking for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_booking.tutor_id <> p_tutor then
    raise exception 'Only the tutor can submit the report' using errcode = '42501';
  end if;
  if v_booking.escrow_state <> 'held' then
    raise exception 'Reports can only be submitted once the session is paid' using errcode = 'check_violation';
  end if;
  if now() < v_booking.scheduled_end then
    raise exception 'You can submit the report once the session ends' using errcode = 'check_violation';
  end if;

  begin
    insert into session_reports (booking_id, student_id, tutor_id, module_code, misconceptions, summary)
    values (p_booking, v_booking.student_id, v_booking.tutor_id, v_booking.module_code, p_misconceptions, p_summary)
    returning * into v_report;
  exception
    when unique_violation then
      raise exception 'Report already submitted' using errcode = 'check_violation';
  end;

  update bookings set report_submitted = true where id = p_booking;
  return v_report;
end;
$$;

-- Reports now only ever come through the function above, so members can no longer insert
-- one directly and skip the time gate.
revoke insert on session_reports from anon, authenticated;
drop policy if exists "tutor writes own report" on session_reports;

revoke execute on function submit_session_report (uuid, uuid, text, text) from anon, authenticated;

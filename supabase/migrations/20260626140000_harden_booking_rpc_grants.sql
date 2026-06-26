-- Earlier migrations revoked anon/authenticated directly, but EXECUTE was still inherited
-- through PUBLIC. These RPCs are reached through server routes using the service role, so
-- remove member access and grant only the role those routes use.

revoke execute on function credit_topup (text) from public, anon, authenticated;
revoke execute on function pay_booking (uuid) from public, anon, authenticated;
revoke execute on function complete_booking (uuid) from public, anon, authenticated;
revoke execute on function refund_booking (uuid) from public, anon, authenticated;
revoke execute on function book_and_pay (uuid, uuid, text, timestamptz, timestamptz, price_type, numeric) from public, anon, authenticated;
revoke execute on function availability_covers (uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function request_booking (uuid, uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function confirm_booking_internal (uuid, uuid, text, timestamptz, timestamptz, numeric) from public, anon, authenticated;
revoke execute on function prune_after_booking (uuid, uuid, uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function accept_booking_request (uuid, uuid) from public, anon, authenticated;
revoke execute on function decline_booking_request (uuid, uuid) from public, anon, authenticated;
revoke execute on function cancel_booking_request (uuid, uuid) from public, anon, authenticated;
revoke execute on function counter_propose (uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function accept_counter_offer (uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function submit_session_report (uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function credit_topup (text) to service_role;
grant execute on function pay_booking (uuid) to service_role;
grant execute on function complete_booking (uuid) to service_role;
grant execute on function refund_booking (uuid) to service_role;
grant execute on function book_and_pay (uuid, uuid, text, timestamptz, timestamptz, price_type, numeric) to service_role;
grant execute on function availability_covers (uuid, timestamptz, timestamptz) to service_role;
grant execute on function request_booking (uuid, uuid, text, timestamptz, timestamptz) to service_role;
grant execute on function confirm_booking_internal (uuid, uuid, text, timestamptz, timestamptz, numeric) to service_role;
grant execute on function prune_after_booking (uuid, uuid, uuid, text, timestamptz, timestamptz) to service_role;
grant execute on function accept_booking_request (uuid, uuid) to service_role;
grant execute on function decline_booking_request (uuid, uuid) to service_role;
grant execute on function cancel_booking_request (uuid, uuid) to service_role;
grant execute on function counter_propose (uuid, uuid, jsonb) to service_role;
grant execute on function accept_counter_offer (uuid, uuid, timestamptz, timestamptz) to service_role;
grant execute on function submit_session_report (uuid, uuid, text, text) to service_role;

-- Direct bid inserts must match the route checks: the tutor cannot bid on their own SOS,
-- must be verified for the module, and must be actively receiving SOS requests.
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
        join profiles p on p.id = auth.uid ()
      where
        r.id = request_id
        and r.student_id <> auth.uid ()
        and r.status = 'open'
        and r.expires_at > now()
        and tm.tutor_id = auth.uid ()
        and tm.is_verified
        and p.is_active
        and p.receiving_sos
    )
  );

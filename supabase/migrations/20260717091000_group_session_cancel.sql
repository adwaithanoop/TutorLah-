-- A host can now call off an open group session, and every held seat is refunded in the
-- same transaction that closes it. The session lock is the same one enrolment takes first,
-- so nobody can pay into a session that is halfway through cancelling. Wallets are credited
-- in student order so two overlapping cancels always lock them the same way round.
create function cancel_group_session (p_group uuid) returns void
language plpgsql
security definer
set search_path = public as $$
declare
  g group_sessions;
  e record;
begin
  select * into g from group_sessions where id = p_group for update;
  if not found then raise exception 'Group session not found'; end if;
  if g.tutor_id <> auth.uid() then
    raise exception 'Not your session' using errcode = '42501';
  end if;
  if g.status <> 'open' then
    raise exception 'Group session is not open' using errcode = 'check_violation';
  end if;

  for e in
    select id, student_id, price_charged from group_enrolments
    where group_session_id = p_group and escrow_state = 'held'
    order by student_id
  loop
    update wallets set balance = balance + e.price_charged, updated_at = now()
    where id = e.student_id;
    insert into wallet_transactions (wallet_id, group_enrolment_id, kind, amount)
    values (e.student_id, e.id, 'escrow_refund', e.price_charged);
    update group_enrolments set escrow_state = 'refunded' where id = e.id;
  end loop;

  update group_sessions set status = 'cancelled' where id = p_group;
end;
$$;

revoke execute on function cancel_group_session (uuid) from public, anon;

grant execute on function cancel_group_session (uuid) to authenticated;

-- The manage policy is for all, so until now a host could flip status or delete the row
-- straight from the client and skip the refunds entirely, stranding every held seat.
-- Status changes must flow through the function above; creation keeps working through
-- the insert half of the policy.
revoke update, delete on table group_sessions from anon, authenticated;

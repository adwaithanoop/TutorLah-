-- These RPCs are called from authenticated user sessions and already enforce their own
-- ownership or admin checks. Remove anonymous execute access inherited through PUBLIC
-- while keeping the member-facing app paths working.

revoke execute on function enrol_in_group (uuid) from public, anon;
revoke execute on function mark_messages_read (uuid) from public, anon;
revoke execute on function review_tutor_module (uuid, boolean, text, boolean) from public, anon;

grant execute on function enrol_in_group (uuid) to authenticated;
grant execute on function mark_messages_read (uuid) to authenticated;
grant execute on function review_tutor_module (uuid, boolean, text, boolean) to authenticated;

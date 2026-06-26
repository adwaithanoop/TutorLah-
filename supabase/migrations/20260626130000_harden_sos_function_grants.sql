-- The earlier revokes targeted anon and authenticated directly, but EXECUTE was still held
-- through the default grant to PUBLIC, so those roles kept access. Revoke PUBLIC and grant
-- only the role each function is meant for. accept_sos_bid is called by the authenticated
-- student who owns the request; expire_stale_requests is a service-role sweep.
revoke execute on function accept_sos_bid (uuid, uuid) from public, anon;

grant execute on function accept_sos_bid (uuid, uuid) to authenticated;

revoke execute on function expire_stale_requests () from public, anon, authenticated;

grant execute on function expire_stale_requests () to service_role;

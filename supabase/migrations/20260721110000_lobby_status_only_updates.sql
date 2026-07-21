-- The creator update policy limits which rows and which status values can change, but the
-- table grant still covers every column, so a creator could rewrite budget, seat limits or
-- the deadline of a live lobby straight from the client. Once tutors bid against the
-- budget that becomes a bait and switch, so limit direct updates to the status column.
revoke update on table group_lobbies from anon, authenticated;

grant update (status) on table group_lobbies to authenticated;

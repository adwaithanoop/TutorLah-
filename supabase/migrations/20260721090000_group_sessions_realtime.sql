-- Enrolments already broadcast through the realtime publication, but the session rows do
-- not, so a newly created or cancelled session only shows up after a manual refresh. Add
-- the table so the open sessions list updates live.
alter publication supabase_realtime
add table group_sessions;

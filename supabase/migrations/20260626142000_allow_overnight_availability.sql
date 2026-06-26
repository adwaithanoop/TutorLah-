-- Let weekly availability blocks start before midnight and finish after midnight.

alter table availability_blocks drop constraint if exists availability_blocks_start_minute_check;
alter table availability_blocks drop constraint if exists availability_blocks_end_minute_check;
alter table availability_blocks drop constraint if exists availability_blocks_duration_check;

alter table availability_blocks
  add constraint availability_blocks_start_minute_check
  check (start_minute between 0 and 1410),
  add constraint availability_blocks_end_minute_check
  check (end_minute between 60 and 1590),
  add constraint availability_blocks_duration_check
  check (end_minute - start_minute between 60 and 180);

create or replace function availability_covers (p_profile uuid, p_start timestamptz, p_end timestamptz) returns boolean
language sql
stable
security definer
set search_path = public as $$
  with local as (
    select
      extract(dow from (p_start at time zone 'Asia/Singapore'))::int as weekday,
      (extract(hour from (p_start at time zone 'Asia/Singapore')) * 60
        + extract(minute from (p_start at time zone 'Asia/Singapore')))::int as start_min,
      (extract(epoch from (p_end - p_start)) / 60)::int as duration_min
  ),
  candidates as (
    select
      l.weekday,
      l.start_min,
      l.start_min + l.duration_min as end_min
    from local l
    union all
    select
      (l.weekday + 6) % 7 as weekday,
      l.start_min + 1440 as start_min,
      l.start_min + 1440 + l.duration_min as end_min
    from local l
  )
  select exists (
    select 1
    from availability_blocks b
    join candidates c on c.weekday = b.weekday
    where b.profile_id = p_profile
      and b.start_minute <= c.start_min
      and b.end_minute >= c.end_min
  );
$$;

revoke execute on function availability_covers (uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function availability_covers (uuid, timestamptz, timestamptz) to service_role;

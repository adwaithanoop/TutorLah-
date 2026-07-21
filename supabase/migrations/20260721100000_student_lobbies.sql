-- Student led group sessions. A student opens a lobby with a total budget and a schedule,
-- classmates join and the budget splits across heads, and tutors bid for the whole lobby
-- the same way they bid on an SOS request. Nothing is charged here: payment, bid acceptance
-- and the deadline sweep arrive in later migrations, so this only lays down the tables,
-- the read rules and the two member facing functions.
create table group_lobbies (
  id uuid primary key default gen_random_uuid (),
  creator_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  title text not null check (char_length(title) between 3 and 100),
  budget numeric(8, 2) not null check (budget > 0),
  min_participants int not null check (min_participants between 2 and 100),
  max_participants int not null check (max_participants between 2 and 100),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  deadline timestamptz not null,
  status text not null default 'open' check (status in ('open', 'locked', 'cancelled', 'disbanded')),
  created_at timestamptz not null default now(),
  check (max_participants >= min_participants),
  check (scheduled_end > scheduled_start),
  check (deadline < scheduled_start)
);

create index group_lobbies_status_idx on group_lobbies (status, module_code);

-- Only open lobbies are ever swept by the future disband job.
create index group_lobbies_open_deadline_idx on group_lobbies (deadline)
where
  status = 'open';

create table lobby_members (
  id uuid primary key default gen_random_uuid (),
  lobby_id uuid not null references group_lobbies (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lobby_id, student_id)
);

create table lobby_bids (
  id uuid primary key default gen_random_uuid (),
  lobby_id uuid not null references group_lobbies (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  amount numeric(8, 2) not null check (amount > 0),
  status bid_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (lobby_id, tutor_id)
);

create unique index lobby_bids_one_accepted_per_lobby on lobby_bids (lobby_id)
where
  status = 'accepted';

alter table group_lobbies enable row level security;

alter table lobby_members enable row level security;

alter table lobby_bids enable row level security;

create policy "lobbies readable by nus" on group_lobbies for
select
  to authenticated using (is_nus ());

create policy "lobby cancellable by creator" on group_lobbies for
update to authenticated using (auth.uid () = creator_id)
with
  check (
    auth.uid () = creator_id
    and status in ('open', 'cancelled')
  );

-- Creation goes through create_lobby so a lobby is never born without its creator seated,
-- and rows are never deleted, only cancelled or disbanded.
revoke insert, delete on table group_lobbies from anon, authenticated;

create policy "lobby members readable by nus" on lobby_members for
select
  to authenticated using (is_nus ());

-- Seats are only handed out by join_lobby, which holds the lobby lock while it counts.
revoke insert, update, delete on table lobby_members from anon, authenticated;

create policy "lobby bids readable by bidder and members" on lobby_bids for
select
  to authenticated using (
    is_nus ()
    and (
      auth.uid () = tutor_id
      or exists (
        select
          1
        from
          lobby_members m
        where
          m.lobby_id = lobby_bids.lobby_id
          and m.student_id = auth.uid ()
      )
    )
  );

-- Mirrors the SOS bid rules: the tutor must be verified for the module, active, cannot bid
-- from inside the lobby, and cannot ask for more than the students budgeted.
create policy "tutors bid on open lobbies" on lobby_bids for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = tutor_id
    and exists (
      select
        1
      from
        group_lobbies l
        join tutor_modules tm on tm.module_code = l.module_code
        join profiles p on p.id = auth.uid ()
      where
        l.id = lobby_id
        and l.status = 'open'
        and l.deadline > now()
        and lobby_bids.amount <= l.budget
        and tm.tutor_id = auth.uid ()
        and tm.is_verified
        and p.is_active
    )
    and not exists (
      select
        1
      from
        lobby_members m
      where
        m.lobby_id = lobby_bids.lobby_id
        and m.student_id = auth.uid ()
    )
  );

-- Accepting or withdrawing a bid becomes a function once lobbies can lock.
revoke update, delete on table lobby_bids from anon, authenticated;

-- The lobby and its creator seat land in one transaction, so head counts never divide by
-- zero and the future disband sweep always has members to walk.
create function create_lobby (
  p_module text,
  p_title text,
  p_budget numeric,
  p_min int,
  p_max int,
  p_start timestamptz,
  p_end timestamptz,
  p_deadline timestamptz
) returns group_lobbies
language plpgsql
security definer
set search_path = public as $$
declare
  l group_lobbies;
begin
  if p_deadline <= now() then
    raise exception 'Deadline must be in the future' using errcode = 'check_violation';
  end if;

  insert into group_lobbies (creator_id, module_code, title, budget, min_participants, max_participants, scheduled_start, scheduled_end, deadline)
  values (auth.uid(), p_module, p_title, p_budget, p_min, p_max, p_start, p_end, p_deadline)
  returning * into l;

  insert into lobby_members (lobby_id, student_id) values (l.id, auth.uid());
  return l;
end;
$$;

-- Same seat guard shape as enrol_in_group: lock the lobby, count under the lock, insert.
-- A duplicate join trips the unique constraint and rolls the transaction back.
create function join_lobby (p_lobby uuid) returns int
language plpgsql
security definer
set search_path = public as $$
declare
  l group_lobbies;
  n int;
begin
  select * into l from group_lobbies where id = p_lobby for update;
  if not found then raise exception 'Lobby not found'; end if;
  if l.status <> 'open' then raise exception 'Lobby is not open' using errcode = 'check_violation'; end if;
  if l.deadline <= now() then raise exception 'Lobby deadline has passed' using errcode = 'check_violation'; end if;

  select count(*) into n from lobby_members where lobby_id = p_lobby;
  if n >= l.max_participants then raise exception 'Lobby is full' using errcode = 'check_violation'; end if;

  insert into lobby_members (lobby_id, student_id) values (p_lobby, auth.uid());
  return n + 1;
end;
$$;

revoke execute on function create_lobby (text, text, numeric, int, int, timestamptz, timestamptz, timestamptz) from public, anon;

grant execute on function create_lobby (text, text, numeric, int, int, timestamptz, timestamptz, timestamptz) to authenticated;

revoke execute on function join_lobby (uuid) from public, anon;

grant execute on function join_lobby (uuid) to authenticated;

alter publication supabase_realtime
add table group_lobbies;

alter publication supabase_realtime
add table lobby_members;

alter publication supabase_realtime
add table lobby_bids;

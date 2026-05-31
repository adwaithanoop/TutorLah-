create table session_reports (
  id uuid primary key default gen_random_uuid (),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  misconceptions text not null check (char_length(misconceptions) >= 10),
  summary text not null check (char_length(summary) >= 10),
  created_at timestamptz not null default now()
);

create index session_reports_student_idx on session_reports (student_id);

create table reviews (
  id uuid primary key default gen_random_uuid (),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table group_sessions (
  id uuid primary key default gen_random_uuid (),
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  title text not null,
  total_cost numeric(8, 2) not null check (total_cost > 0),
  max_participants int not null check (max_participants between 1 and 100),
  floor_per_student numeric(8, 2) not null check (floor_per_student >= 0),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start)
);

create table group_enrolments (
  id uuid primary key default gen_random_uuid (),
  group_session_id uuid not null references group_sessions (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  price_charged numeric(8, 2) not null,
  created_at timestamptz not null default now(),
  unique (group_session_id, student_id)
);

create table availability (
  id uuid primary key default gen_random_uuid (),
  profile_id uuid not null references profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  kind text not null default 'flexible' check (kind in ('fixed', 'flexible')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index availability_profile_idx on availability (profile_id);

alter table session_reports enable row level security;

alter table reviews enable row level security;

alter table group_sessions enable row level security;

alter table group_enrolments enable row level security;

alter table availability enable row level security;

create policy "reports readable by nus" on session_reports for
select
  to authenticated using (is_nus ());

create policy "tutor writes own report" on session_reports for insert to authenticated
with
  check (is_nus () and auth.uid () = tutor_id);

create policy "reviews readable by nus" on reviews for
select
  to authenticated using (is_nus ());

create policy "student writes own review" on reviews for insert to authenticated
with
  check (is_nus () and auth.uid () = student_id);

create policy "group sessions readable by nus" on group_sessions for
select
  to authenticated using (is_nus ());

create policy "tutor manages own group sessions" on group_sessions for all to authenticated using (auth.uid () = tutor_id)
with
  check (auth.uid () = tutor_id);

create policy "enrolments readable by nus" on group_enrolments for
select
  to authenticated using (is_nus ());

create policy "availability readable by nus" on availability for
select
  to authenticated using (is_nus ());

create policy "own availability write" on availability for all to authenticated using (auth.uid () = profile_id)
with
  check (auth.uid () = profile_id);

create function enrol_in_group (p_group uuid) returns numeric
language plpgsql
security definer
set search_path = public as $$
declare
  g group_sessions;
  n int;
  price numeric;
begin
  select * into g from group_sessions where id = p_group for update;
  if not found then raise exception 'Group session not found'; end if;
  if g.status <> 'open' then raise exception 'Group session is closed' using errcode = 'check_violation'; end if;

  select count(*) into n from group_enrolments where group_session_id = p_group;
  if n >= g.max_participants then raise exception 'Group session is full' using errcode = 'check_violation'; end if;

  price := round(greatest(g.floor_per_student, g.total_cost / (n + 1)), 2);
  insert into group_enrolments (group_session_id, student_id, price_charged)
  values (p_group, auth.uid(), price);
  return price;
end;
$$;

create function recompute_tutor_rating () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  update profiles set
    rating_count = (select count(*) from reviews where tutor_id = new.tutor_id),
    avg_rating = coalesce((select avg(rating) from reviews where tutor_id = new.tutor_id), 0)
  where id = new.tutor_id;
  return new;
end;
$$;

create trigger reviews_recompute_rating
after insert on reviews for each row
execute function recompute_tutor_rating ();

create function bump_sessions_booked () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  update profiles set sessions_booked = sessions_booked + 1 where id = new.tutor_id;
  return new;
end;
$$;

create trigger bookings_bump_booked
after insert on bookings for each row
execute function bump_sessions_booked ();

create function bump_sessions_completed () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  if new.escrow_state = 'released' and old.escrow_state <> 'released' then
    update profiles set sessions_completed = sessions_completed + 1 where id = new.tutor_id;
  end if;
  return new;
end;
$$;

create trigger bookings_bump_completed
after update on bookings for each row
execute function bump_sessions_completed ();

alter publication supabase_realtime
add table sos_requests;

alter publication supabase_realtime
add table sos_bids;

alter publication supabase_realtime
add table group_enrolments;

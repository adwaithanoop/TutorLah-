create type subject_level as enum ('o_level', 'a_level', 'nus', 'ntu');

create type module_grade as enum ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C');

create table subjects (
  module_code text primary key,
  level subject_level not null,
  title text not null,
  parent_id text references subjects (module_code) on delete set null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  faculty text,
  year text,
  is_active boolean not null default false,
  avatar_color text not null default 'bg-indigo-500',
  rate_per_hour numeric(6, 2) not null default 0,
  avg_rating numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  sessions_completed integer not null default 0,
  sessions_booked integer not null default 0,
  created_at timestamptz not null default now()
);

create table tutor_modules (
  id uuid primary key default gen_random_uuid (),
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code) on delete cascade,
  grade module_grade not null,
  completed_at date not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tutor_id, module_code)
);

create index tutor_modules_module_code_idx on tutor_modules (module_code);

create function handle_new_user () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function handle_new_user ();

alter table subjects enable row level security;

alter table profiles enable row level security;

alter table tutor_modules enable row level security;

create policy "subjects readable by authenticated" on subjects for
select
  to authenticated using (true);

create policy "profiles readable by authenticated" on profiles for
select
  to authenticated using (true);

create policy "tutor_modules readable by authenticated" on tutor_modules for
select
  to authenticated using (true);

create policy "own profile insert" on profiles for insert to authenticated
with
  check (auth.uid () = id);

create policy "own profile update" on profiles
for update
  to authenticated using (auth.uid () = id)
with
  check (auth.uid () = id);

create policy "own tutor_modules insert" on tutor_modules for insert to authenticated
with
  check (auth.uid () = tutor_id);

create policy "own tutor_modules update" on tutor_modules
for update
  to authenticated using (auth.uid () = tutor_id)
with
  check (
    auth.uid () = tutor_id
    and is_verified = (
      select
        tm.is_verified
      from
        tutor_modules tm
      where
        tm.id = tutor_modules.id
    )
  );

create policy "own tutor_modules delete" on tutor_modules for delete to authenticated using (auth.uid () = tutor_id);

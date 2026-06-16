create table admins (
  id uuid primary key references profiles (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references profiles (id)
);

alter table admins enable row level security;

create policy "admins read own admin row" on admins for
select
  to authenticated using (auth.uid () = id);

create function is_admin () returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1 from admins where id = auth.uid ()
  );
$$;

create type verification_status as enum ('pending', 'verified', 'rejected');

alter table tutor_modules
add column verification_status verification_status not null default 'pending',
add column reviewed_by uuid references profiles (id),
add column reviewed_at timestamptz,
add column review_note text;

update tutor_modules
set
  verification_status = 'verified'
where
  is_verified;

drop policy "own tutor_modules update" on tutor_modules;

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
    and verification_status = (
      select
        tm.verification_status
      from
        tutor_modules tm
      where
        tm.id = tutor_modules.id
    )
  );

create policy "admins read all transcripts" on storage.objects for
select
  to authenticated using (
    bucket_id = 'transcripts'
    and is_admin ()
  );

create function review_tutor_module (p_module uuid, p_approve boolean, p_note text default null) returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if not is_admin () then
    raise exception 'Not an admin' using errcode = '42501';
  end if;

  update tutor_modules
  set
    is_verified = p_approve,
    verification_status = case when p_approve then 'verified'::verification_status else 'rejected'::verification_status end,
    reviewed_by = auth.uid (),
    reviewed_at = now(),
    review_note = nullif(btrim(p_note), '')
  where
    id = p_module;

  if not found then
    raise exception 'Module not found';
  end if;
end;
$$;

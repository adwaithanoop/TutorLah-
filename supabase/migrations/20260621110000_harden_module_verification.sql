-- Verification state is admin-only. Tutors may write a module's identity and its
-- transcript path, never its verification fields. The admin RPC runs as definer and
-- stays the sole writer of is_verified / verification_status / allow_resubmit.
revoke insert, update, delete on tutor_modules from anon;
revoke insert, update on tutor_modules from authenticated;

grant insert (tutor_id, module_code, grade, completed_at, transcript_path) on tutor_modules to authenticated;
grant update (transcript_path) on tutor_modules to authenticated;

drop policy "own tutor_modules insert" on tutor_modules;

create policy "own tutor_modules insert" on tutor_modules for insert to authenticated
with
  check (
    auth.uid () = tutor_id
    and is_verified = false
    and verification_status = 'pending'
    and allow_resubmit = true
    and reviewed_by is null
    and reviewed_at is null
    and review_note is null
    and transcript_path like auth.uid ()::text || '/%'
  );

drop policy "own tutor_modules update" on tutor_modules;

create policy "own tutor_modules update" on tutor_modules
for update
  to authenticated using (
    auth.uid () = tutor_id
    and not (
      verification_status = 'rejected'
      and not allow_resubmit
    )
  )
with
  check (
    auth.uid () = tutor_id
    and transcript_path like auth.uid ()::text || '/%'
  );

drop policy "tutor_modules readable by nus" on tutor_modules;

create policy "own tutor_modules select" on tutor_modules for
select
  to authenticated using (auth.uid () = tutor_id);

create policy "admins read tutor_modules" on tutor_modules for
select
  to authenticated using (is_admin ());

-- Public read model for tutor search: verified rows only, no transcript paths or
-- review notes. security_invoker stays off so any signed-in student can see every
-- verified tutor, while the base table itself is owner and admin only.
create view verified_tutor_modules
with
  (security_invoker = false) as
select
  tm.tutor_id,
  tm.module_code,
  tm.grade,
  tm.completed_at,
  tm.is_verified,
  p.full_name,
  p.year,
  p.faculty,
  p.avatar_color,
  p.rate_per_hour,
  p.is_active,
  p.avg_rating,
  p.rating_count,
  p.sessions_completed,
  p.sessions_booked
from
  tutor_modules tm
  join profiles p on p.id = tm.tutor_id
where
  tm.is_verified;

grant select on verified_tutor_modules to authenticated;

-- A permanent rejection is a moderation fact that must outlive the tutor_modules row,
-- so a tutor cannot escape it by deleting and re-adding the module. Only the admin RPC
-- writes this table.
create table module_verification_blocks (
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code) on delete cascade,
  reason text,
  blocked_by uuid references profiles (id),
  blocked_at timestamptz not null default now(),
  primary key (tutor_id, module_code)
);

alter table module_verification_blocks enable row level security;

revoke all on module_verification_blocks from anon, authenticated;
grant select on module_verification_blocks to authenticated;

create policy "read own blocks" on module_verification_blocks for
select
  to authenticated using (auth.uid () = tutor_id);

create policy "admins read blocks" on module_verification_blocks for
select
  to authenticated using (is_admin ());

create function deny_blocked_module () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  if exists (
    select 1 from module_verification_blocks b
    where b.tutor_id = new.tutor_id and b.module_code = new.module_code
  ) then
    raise exception 'Module permanently rejected for this tutor' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger tutor_modules_block_guard before insert on tutor_modules for each row
execute function deny_blocked_module ();

create or replace function review_tutor_module (p_module uuid, p_approve boolean, p_note text default null, p_allow_resubmit boolean default true) returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_tutor uuid;
  v_module_code text;
begin
  if not is_admin () then
    raise exception 'Not an admin' using errcode = '42501';
  end if;

  update tutor_modules
  set
    is_verified = p_approve,
    verification_status = case when p_approve then 'verified'::verification_status else 'rejected'::verification_status end,
    allow_resubmit = case when p_approve then true else p_allow_resubmit end,
    reviewed_by = auth.uid (),
    reviewed_at = now(),
    review_note = nullif(btrim(p_note), '')
  where
    id = p_module
  returning tutor_id, module_code into v_tutor, v_module_code;

  if not found then
    raise exception 'Module not found';
  end if;

  if p_approve then
    delete from module_verification_blocks
    where tutor_id = v_tutor and module_code = v_module_code;
  elsif not p_allow_resubmit then
    insert into module_verification_blocks (tutor_id, module_code, reason, blocked_by)
    values (v_tutor, v_module_code, nullif(btrim(p_note), ''), auth.uid ())
    on conflict (tutor_id, module_code) do update
    set
      reason = excluded.reason,
      blocked_by = excluded.blocked_by,
      blocked_at = now();
  end if;
end;
$$;

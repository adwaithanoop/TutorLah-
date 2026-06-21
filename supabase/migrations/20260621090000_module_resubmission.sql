alter table tutor_modules
add column allow_resubmit boolean not null default true;

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
    and allow_resubmit = (
      select
        tm.allow_resubmit
      from
        tutor_modules tm
      where
        tm.id = tutor_modules.id
    )
  );

drop function if exists review_tutor_module (uuid, boolean, text);

create function review_tutor_module (p_module uuid, p_approve boolean, p_note text default null, p_allow_resubmit boolean default true) returns void
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
    allow_resubmit = case when p_approve then true else p_allow_resubmit end,
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

create function enforce_nus_email () returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  if new.email is null or new.email !~* '@u\.nus\.edu$' then
    raise exception 'Only @u.nus.edu accounts may register'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger enforce_nus_email_before_insert
before insert on auth.users for each row
execute function enforce_nus_email ();

drop policy "subjects readable by authenticated" on subjects;

drop policy "profiles readable by authenticated" on profiles;

drop policy "tutor_modules readable by authenticated" on tutor_modules;

create policy "subjects readable by nus" on subjects for
select
  to authenticated using (coalesce(auth.email (), '') ~* '@u\.nus\.edu$');

create policy "profiles readable by nus" on profiles for
select
  to authenticated using (coalesce(auth.email (), '') ~* '@u\.nus\.edu$');

create policy "tutor_modules readable by nus" on tutor_modules for
select
  to authenticated using (coalesce(auth.email (), '') ~* '@u\.nus\.edu$');

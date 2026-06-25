alter table profiles
add column avatar_path text;

insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

create policy "avatars readable by authenticated" on storage.objects for
select
  to authenticated using (bucket_id = 'avatars');

create policy "users upload own avatar" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'avatars'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "users update own avatar" on storage.objects
for update
  to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  )
with
  check (
    bucket_id = 'avatars'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "users delete own avatar" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

drop view verified_tutor_modules;

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
  p.avatar_path,
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

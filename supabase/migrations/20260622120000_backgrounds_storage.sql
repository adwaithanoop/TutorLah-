insert into
  storage.buckets (id, name, public)
values
  ('backgrounds', 'backgrounds', true)
on conflict (id) do nothing;

create policy "backgrounds are publicly readable" on storage.objects for
select
  using (bucket_id = 'backgrounds');

create policy "admins manage backgrounds" on storage.objects for all to authenticated using (
  bucket_id = 'backgrounds'
  and is_admin ()
)
with
  check (
    bucket_id = 'backgrounds'
    and is_admin ()
  );

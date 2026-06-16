create table cheatsheets (
  id uuid primary key default gen_random_uuid (),
  uploader_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  test_label text not null check (char_length(btrim(test_label)) between 1 and 100),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  file_path text not null,
  created_at timestamptz not null default now()
);

create index cheatsheets_module_idx on cheatsheets (module_code, created_at desc);

create index cheatsheets_uploader_idx on cheatsheets (uploader_id);

alter table cheatsheets enable row level security;

create policy "cheatsheets readable by nus" on cheatsheets for
select
  to authenticated using (is_nus ());

create policy "own cheatsheets insert" on cheatsheets for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = uploader_id
  );

create policy "own cheatsheets delete" on cheatsheets for delete to authenticated using (auth.uid () = uploader_id);

insert into
  storage.buckets (id, name, public)
values
  ('cheatsheets', 'cheatsheets', false)
on conflict (id) do nothing;

create policy "cheatsheet files readable by nus" on storage.objects for
select
  to authenticated using (
    bucket_id = 'cheatsheets'
    and is_nus ()
  );

create policy "users upload own cheatsheet files" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'cheatsheets'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "users delete own cheatsheet files" on storage.objects for delete to authenticated using (
  bucket_id = 'cheatsheets'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

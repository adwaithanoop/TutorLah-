create function shares_booking (a uuid, b uuid) returns boolean
language sql
stable
security definer
set search_path = public as $$
  select exists (
    select 1 from bookings
    where (student_id = a and tutor_id = b)
       or (student_id = b and tutor_id = a)
  );
$$;

create table messages (
  id uuid primary key default gen_random_uuid (),
  sender_id uuid not null references profiles (id) on delete cascade,
  recipient_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index messages_pair_idx on messages (sender_id, recipient_id, created_at);

create index messages_recipient_idx on messages (recipient_id, created_at);

alter table messages enable row level security;

create policy "messages readable by participants" on messages for
select
  to authenticated using (
    is_nus () and (auth.uid () = sender_id or auth.uid () = recipient_id)
  );

create policy "send to booking partners only" on messages for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = sender_id
    and shares_booking (auth.uid (), recipient_id)
  );

alter publication supabase_realtime
add table messages;

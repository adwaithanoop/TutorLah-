create table telegram_accounts (
  user_id uuid primary key references profiles (id) on delete cascade,
  chat_id bigint not null unique,
  username text,
  linked_at timestamptz not null default now()
);

alter table telegram_accounts enable row level security;

create policy "read own telegram account" on telegram_accounts for
select
  to authenticated using (auth.uid () = user_id);

create table telegram_link_tokens (
  token text primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index telegram_link_tokens_user_id_idx on telegram_link_tokens (user_id);

alter table telegram_link_tokens enable row level security;

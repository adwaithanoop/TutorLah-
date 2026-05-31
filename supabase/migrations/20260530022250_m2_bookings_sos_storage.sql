create function is_nus () returns boolean
language sql
stable
security definer
set search_path = public, auth as $$
  select coalesce(auth.email(), '') ~* '@u\.nus\.edu$';
$$;

create type escrow_state as enum (
  'pending_payment',
  'held',
  'completed',
  'released',
  'cancelled',
  'refunded'
);

create type price_type as enum ('fixed', 'negotiable');

create type sos_status as enum ('open', 'matched', 'cancelled');

create type bid_status as enum ('pending', 'accepted', 'rejected');

alter table tutor_modules
add column transcript_path text;

create table bookings (
  id uuid primary key default gen_random_uuid (),
  student_id uuid not null references profiles (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  price_type price_type not null,
  amount numeric(8, 2) not null check (amount > 0),
  escrow_state escrow_state not null default 'pending_payment',
  report_submitted boolean not null default false,
  created_at timestamptz not null default now(),
  check (scheduled_end > scheduled_start),
  check (student_id <> tutor_id)
);

create index bookings_student_idx on bookings (student_id);

create index bookings_tutor_idx on bookings (tutor_id);

create table sos_requests (
  id uuid primary key default gen_random_uuid (),
  student_id uuid not null references profiles (id) on delete cascade,
  module_code text not null references subjects (module_code),
  description text not null check (char_length(description) between 10 and 1000),
  status sos_status not null default 'open',
  created_at timestamptz not null default now()
);

create index sos_requests_status_idx on sos_requests (status, module_code);

create table sos_bids (
  id uuid primary key default gen_random_uuid (),
  request_id uuid not null references sos_requests (id) on delete cascade,
  tutor_id uuid not null references profiles (id) on delete cascade,
  rate numeric(8, 2) not null check (rate > 0),
  status bid_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (request_id, tutor_id)
);

create unique index sos_bids_one_accepted_per_request on sos_bids (request_id)
where
  status = 'accepted';

alter table bookings enable row level security;

alter table sos_requests enable row level security;

alter table sos_bids enable row level security;

create policy "bookings readable by parties" on bookings for
select
  to authenticated using (is_nus () and (auth.uid () = student_id or auth.uid () = tutor_id));

create policy "students create own bookings" on bookings for insert to authenticated
with
  check (is_nus () and auth.uid () = student_id);

create policy "sos readable by nus" on sos_requests for
select
  to authenticated using (is_nus ());

create policy "students create own sos" on sos_requests for insert to authenticated
with
  check (is_nus () and auth.uid () = student_id);

create policy "sos cancellable by owner" on sos_requests
for update
  to authenticated using (auth.uid () = student_id)
with
  check (auth.uid () = student_id and status in ('open', 'cancelled'));

create policy "bids readable by request owner and bidder" on sos_bids for
select
  to authenticated using (
    is_nus ()
    and (
      auth.uid () = tutor_id
      or auth.uid () = (
        select
          r.student_id
        from
          sos_requests r
        where
          r.id = request_id
      )
    )
  );

create policy "tutors create own bids" on sos_bids for insert to authenticated
with
  check (is_nus () and auth.uid () = tutor_id);

insert into
  storage.buckets (id, name, public)
values
  ('transcripts', 'transcripts', false)
on conflict (id) do nothing;

create policy "tutors upload own transcripts" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'transcripts'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "tutors read own transcripts" on storage.objects for
select
  to authenticated using (
    bucket_id = 'transcripts'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create function accept_sos_bid (p_request uuid, p_bid uuid) returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  v_request sos_requests;
  v_bid sos_bids;
  v_booking_id uuid;
begin
  select * into v_request from sos_requests where id = p_request for update;
  if not found then raise exception 'SOS request not found'; end if;
  if v_request.student_id <> auth.uid() then
    raise exception 'Not your request' using errcode = '42501';
  end if;
  if v_request.status <> 'open' then
    raise exception 'Request is no longer open' using errcode = 'check_violation';
  end if;

  select * into v_bid from sos_bids where id = p_bid and request_id = p_request;
  if not found then raise exception 'Bid not found'; end if;

  update sos_bids set status = 'accepted' where id = p_bid;
  update sos_bids set status = 'rejected'
    where request_id = p_request and id <> p_bid and status = 'pending';
  update sos_requests set status = 'matched' where id = p_request;

  insert into bookings (student_id, tutor_id, module_code, scheduled_start, scheduled_end, price_type, amount)
  values (v_request.student_id, v_bid.tutor_id, v_request.module_code, now(), now() + interval '1 hour', 'fixed', v_bid.rate)
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

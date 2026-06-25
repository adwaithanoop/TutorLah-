alter table messages
add column read_at timestamptz;

create index messages_unread_idx on messages (recipient_id, sender_id)
where
  read_at is null;

-- senders must not pre-set read_at; only mark_messages_read may mark a message read
drop policy "send to booking partners only" on messages;

create policy "send to booking partners only" on messages for insert to authenticated
with
  check (
    is_nus ()
    and auth.uid () = sender_id
    and shares_booking (auth.uid (), recipient_id)
    and read_at is null
  );

create function mark_messages_read (p_other uuid) returns void
language sql
security definer
set search_path = public as $$
  update messages
  set read_at = now()
  where recipient_id = auth.uid ()
    and sender_id = p_other
    and read_at is null;
$$;

revoke all on function mark_messages_read (uuid)
from
  public;

grant
execute on function mark_messages_read (uuid) to authenticated;

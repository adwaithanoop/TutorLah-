-- A booking only exists once it is paid for. This creates the booking and funds its
-- escrow in one locked transaction: the row is inserted straight into the held state
-- alongside the wallet debit, and insufficient funds raise before anything is written.
create function book_and_pay (
  p_student uuid,
  p_tutor uuid,
  p_module text,
  p_start timestamptz,
  p_end timestamptz,
  p_price_type price_type,
  p_amount numeric
) returns bookings
language plpgsql
security definer
set search_path = public as $$
declare
  v_booking bookings;
  v_balance numeric(12, 2);
begin
  insert into wallets (id) values (p_student) on conflict (id) do nothing;
  select balance into v_balance from wallets where id = p_student for update;
  if v_balance < p_amount then
    raise exception 'Insufficient wallet balance' using errcode = 'check_violation';
  end if;

  update wallets set balance = balance - p_amount, updated_at = now() where id = p_student;

  insert into bookings (student_id, tutor_id, module_code, scheduled_start, scheduled_end, price_type, amount, escrow_state)
  values (p_student, p_tutor, p_module, p_start, p_end, p_price_type, p_amount, 'held')
  returning * into v_booking;

  insert into wallet_transactions (wallet_id, booking_id, kind, amount)
  values (p_student, v_booking.id, 'escrow_hold', -p_amount);

  return v_booking;
end;
$$;

revoke execute on function book_and_pay (uuid, uuid, text, timestamptz, timestamptz, price_type, numeric)
from anon, authenticated;

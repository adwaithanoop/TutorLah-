-- Let a student hedge one time slot across different modules. Two requests that share a
-- student, tutor and start but differ in module are now distinct, so a student can ask
-- tutor A for CS2030S and CS2040S at the same hour and let the acceptance decide which
-- lesson happens. Only an exact repeat (same module too) is still treated as a duplicate.
drop index if exists booking_requests_one_live;

create unique index booking_requests_one_live on booking_requests (
  student_id,
  tutor_id,
  scheduled_start,
  module_code
)
where
  status = 'pending';

-- A student can never hold two overlapping confirmed sessions, mirroring the per-tutor
-- guard. This makes the collapse on acceptance a database guarantee rather than something
-- only the pruning logic enforces: if two tutors accept overlapping requests for the same
-- student at once, the second booking is rejected outright instead of slipping through.
alter table bookings
  add constraint bookings_no_student_overlap
  exclude using gist (
    student_id with =,
    tstzrange (scheduled_start, scheduled_end, '[)') with &&
  )
  where (escrow_state not in ('cancelled', 'refunded'));

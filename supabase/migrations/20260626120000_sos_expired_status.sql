-- An SOS request now has a hard lifetime: once its window passes it becomes 'expired' and
-- stops showing up for tutors or being acceptable by the student. The enum value is added
-- in its own migration so it is committed before any later migration references it.
alter type sos_status add value if not exists 'expired';

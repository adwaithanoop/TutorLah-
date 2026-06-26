-- Keep direct SOS bid inserts aligned with the API validation cap.

alter table sos_bids drop constraint if exists sos_bids_amount_cap_check;

alter table sos_bids
  add constraint sos_bids_amount_cap_check
  check (amount <= 1000);

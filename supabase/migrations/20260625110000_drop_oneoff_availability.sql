-- One-off availability slots only ever fed the chat "propose a session" helper, which
-- has been removed. Bookable availability lives in availability_blocks, so this table,
-- along with its index and row-level policies, is no longer referenced anywhere.
drop table if exists availability;

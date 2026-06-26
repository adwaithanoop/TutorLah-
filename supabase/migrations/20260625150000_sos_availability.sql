alter table profiles
add column receiving_sos boolean not null default false;

-- existing active tutors keep receiving SOS so behaviour is unchanged on rollout
update profiles
set
  receiving_sos = is_active;

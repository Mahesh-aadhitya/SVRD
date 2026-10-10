-- Whether devotees may ask for this seva on a special day of their own
-- (the request + priest call-back), set by the admin per seva.
alter table sevas add column if not exists allow_requests boolean not null default true;

-- Darshan check-in and prasadam: an admin scans the ticket QR at the
-- temple. The first scan marks darshan done; the same QR can then be
-- scanned again (that day or later) to hand over prasadam. Once both are
-- set the QR is fully spent.

alter table bookings add column checked_in_at timestamptz;
alter table bookings add column checked_in_by uuid references admin_users(id) on delete set null;
alter table bookings add column prasadam_claimed_at timestamptz;
alter table bookings add column prasadam_claimed_by uuid references admin_users(id) on delete set null;

alter table bookings add constraint bookings_prasadam_after_darshan
  check (prasadam_claimed_at is null or checked_in_at is not null);

-- The daily darshan list reads bookings by check-in time.
create index bookings_checked_in_at_idx on bookings(checked_in_at) where checked_in_at is not null;

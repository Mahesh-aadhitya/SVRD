-- Site-wide settings the admin controls (singleton row, same pattern as
-- live_config): the website's background song, and the temple's UPI
-- details shown to devotees when they book a paid seva.
--
-- UPI payments are confirmed by proof: the devotee pays from any UPI app,
-- uploads the payment screenshot, and the ticket is issued straight away
-- marked "payment submitted". The transaction reference (UTR) is read from
-- the screenshot when possible. Admins check every proof in the payment
-- log and mark it verified (→ paid) or rejected (→ unpaid again).

create table site_settings (
  id boolean primary key default true check (id),
  -- Null = the built-in chant (/audio/om-namo-narayanaya.mp3).
  background_audio_url text,
  background_audio_title text not null default '',
  upi_id text not null default '',
  upi_number text not null default '',
  upi_payee_name text not null default '',
  upi_qr_url text,
  updated_at timestamptz not null default now()
);
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();
insert into site_settings (id) values (true);

alter table site_settings enable row level security;
create policy site_settings_public_read on site_settings for select using (true);

-- ── UPI payment proof on bookings ────────────────────────────────────────

alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'submitted', 'paid', 'refunded'));

alter table bookings add column payment_method text check (payment_method in ('upi', 'counter'));
-- Path in the private payment-proofs bucket; admins read it via signed URLs.
alter table bookings add column payment_proof_path text;
alter table bookings add column payment_utr text check (payment_utr is null or length(payment_utr) <= 40);
alter table bookings add column payment_submitted_at timestamptz;
alter table bookings add column payment_reviewed_at timestamptz;
alter table bookings add column payment_reviewed_by uuid references admin_users(id) on delete set null;
alter table bookings add column payment_note text check (payment_note is null or length(payment_note) <= 300);

-- The admin payment log reads proofs newest first.
create index bookings_payment_submitted_idx on bookings(payment_submitted_at desc) where payment_proof_path is not null;

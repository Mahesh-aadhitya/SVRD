-- Stricter UPI pay-by-proof.
--
-- Payment QR sessions: the temple's UPI QR / ID is shown to a devotee for
-- 10 minutes at a time. Each time it's shown, the start is recorded here;
-- a screenshot is only accepted if the payment time on it falls inside
-- one of these windows (so an old or unrelated payment can't be reused).
alter table bookings add column payment_sessions jsonb not null default '[]'
  constraint bookings_payment_sessions_is_array check (jsonb_typeof(payment_sessions) = 'array');

-- Every screenshot a devotee uploads — accepted or auto-rejected — with
-- what was read from it, so the office can see attempts with fake or
-- unrelated pictures too. Service role only.
create table payment_attempts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  proof_path text not null,
  accepted boolean not null,
  -- Why it was rejected (machine code), null when accepted.
  reason text,
  -- What the screenshot reader extracted (amount, payee, time, UTR…).
  reading jsonb,
  created_at timestamptz not null default now()
);
create index payment_attempts_created_idx on payment_attempts(created_at desc);
create index payment_attempts_booking_idx on payment_attempts(booking_id, created_at desc);

alter table payment_attempts enable row level security;

-- One UPI transaction can only pay for one booking.
create index bookings_payment_utr_idx on bookings(payment_utr) where payment_utr is not null;

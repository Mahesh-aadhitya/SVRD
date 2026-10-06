-- Devotee accounts (Google sign-in through Supabase Auth): a profile per
-- devotee, their bookings linked to the account, and online donations paid
-- through Razorpay. Devotees can only ever read their own rows; every write
-- goes through server actions using the service role after checking the
-- signed-in user.

-- ── Profiles ─────────────────────────────────────────────────────────────

create table devotee_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  gotram text,
  nakshatram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger devotee_profiles_set_updated_at before update on devotee_profiles
  for each row execute function set_updated_at();

alter table devotee_profiles enable row level security;
create policy devotee_profiles_self_read on devotee_profiles
  for select using (id = auth.uid());

-- ── Bookings belong to an account ────────────────────────────────────────

-- Null for bookings made before accounts existed, until the devotee claims
-- them (reference + the mobile number used to book).
alter table bookings add column user_id uuid references auth.users(id) on delete set null;
create index bookings_user_idx on bookings(user_id, booking_date desc) where user_id is not null;

create policy bookings_owner_read on bookings
  for select using (user_id is not null and user_id = auth.uid());

-- ── Donations ────────────────────────────────────────────────────────────

create table donations (
  id uuid primary key default gen_random_uuid(),
  -- Shown on the receipt, also sent to Razorpay as the order receipt.
  receipt_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  purpose text not null check (purpose in ('general', 'annadanam', 'gau_seva', 'renovation', 'festival')),
  -- Whole rupees (Razorpay is sent paise).
  amount int not null check (amount between 1 and 1000000),
  donor_name text not null check (length(trim(donor_name)) between 2 and 100),
  phone text not null default '',
  email text not null default '',
  note text check (note is null or length(note) <= 300),
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger donations_set_updated_at before update on donations
  for each row execute function set_updated_at();
create index donations_user_idx on donations(user_id, created_at desc) where user_id is not null;
create index donations_paid_idx on donations(paid_at desc) where status = 'paid';

alter table donations enable row level security;
create policy donations_owner_read on donations
  for select using (user_id is not null and user_id = auth.uid());

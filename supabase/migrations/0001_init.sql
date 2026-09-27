-- Sri Varadaraja Swamy Devalaya (temple-app) — initial schema
-- Replaces src/lib/placeholder-data.ts with real, persisted tables.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── Admin ────────────────────────────────────────────────────────────────

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
create policy admin_users_self_read on admin_users
  for select using (auth.uid() = id);

-- ── Content ──────────────────────────────────────────────────────────────

create table poojas (
  id text primary key,
  name jsonb not null,
  description jsonb not null,
  timing text not null,
  is_bookable boolean not null default false,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger poojas_set_updated_at before update on poojas
  for each row execute function set_updated_at();

create table sevas (
  id text primary key,
  name jsonb not null,
  description jsonb not null,
  price int not null default 0,
  capacity_per_slot int not null default 1,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sevas_set_updated_at before update on sevas
  for each row execute function set_updated_at();

create table events (
  id text primary key,
  title jsonb not null,
  event_date date not null,
  description jsonb not null,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger events_set_updated_at before update on events
  for each row execute function set_updated_at();

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('photo', 'video')),
  album text not null,
  image_url text not null,
  youtube_id text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,
  category text not null,
  duration text not null,
  audio_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Bookings ─────────────────────────────────────────────────────────────

create table bookings (
  id uuid primary key default gen_random_uuid(),
  seva_id text not null references sevas(id),
  booking_date date not null,
  devotee_name text not null,
  phone text not null,
  amount int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- Used to lock a (seva, date) slot with `select ... for update` while
-- checking capacity_per_slot, so concurrent bookings can't oversell a slot.
create index bookings_seva_date_idx on bookings(seva_id, booking_date)
  where status <> 'cancelled';

-- ── Live streaming ───────────────────────────────────────────────────────

create table live_config (
  id boolean primary key default true check (id),
  platform text not null default 'youtube' check (platform in ('youtube', 'instagram')),
  youtube_video_id text,
  instagram_url text,
  is_live boolean not null default false,
  scheduled_at text,
  queue_capacity int not null default 500,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);
insert into live_config (id) values (true);

create table live_archive (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null,
  youtube_id text not null,
  created_at timestamptz not null default now()
);

-- ── Comments (post-moderation: visible immediately, admin can hide) ────────

create table comments (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  text text not null,
  context text not null,
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  created_at timestamptz not null default now()
);
create index comments_context_idx on comments(context, created_at desc);

-- ── Virtual queue (TTD-style, gates /live under load) ───────────────────

create table queues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'live_view' check (kind in ('live_view', 'seva_slot')),
  capacity int not null default 200,
  throughput_per_min int not null default 60,
  status text not null default 'idle' check (status in ('idle', 'running', 'paused')),
  next_position int not null default 0,
  current_serving int not null default 0,
  updated_at timestamptz not null default now()
);

create table queue_tickets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references queues(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  token text not null,
  position int not null,
  status text not null default 'waiting' check (status in ('waiting', 'called', 'active', 'expired')),
  push_subscription jsonb,
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  entered_at timestamptz,
  expires_at timestamptz
);

-- One active/waiting ticket per devotee per queue — the anti-duplicate guard.
create unique index queue_tickets_one_active_per_user
  on queue_tickets(queue_id, user_id)
  where status in ('waiting', 'called', 'active');

-- ── Row Level Security: public read of published content ─────────────────
-- Server Actions/route handlers write via the service-role key (bypasses RLS)
-- after verifyAdminSession(); these policies only govern the anon-key reads
-- the devotee-facing pages and the queue/comment flows perform directly.

alter table poojas enable row level security;
create policy poojas_public_read on poojas for select using (true);

alter table sevas enable row level security;
create policy sevas_public_read on sevas for select using (is_active);

alter table events enable row level security;
create policy events_public_read on events for select using (true);

alter table gallery_items enable row level security;
create policy gallery_public_read on gallery_items for select using (true);

alter table songs enable row level security;
create policy songs_public_read on songs for select using (true);

alter table live_config enable row level security;
create policy live_config_public_read on live_config for select using (true);

alter table live_archive enable row level security;
create policy live_archive_public_read on live_archive for select using (true);

alter table comments enable row level security;
create policy comments_public_read on comments for select using (status = 'approved');
create policy comments_public_insert on comments for insert with check (true);

alter table bookings enable row level security;
-- No public select policy: booking details (name/phone) are only readable
-- via the service-role key inside admin Server Actions.

alter table queues enable row level security;
create policy queues_public_read on queues for select using (true);

alter table queue_tickets enable row level security;
create policy queue_tickets_own_read on queue_tickets
  for select using (auth.uid() = user_id);

-- Sevas on request: a new seva type ("request") that has no booking dates
-- and is performed only when a devotee asks, and seva_requests — a devotee
-- asking for any seva on a day of their choosing (birthday, anniversary…).
-- The priest is told and calls them back; the office tracks each request.
alter table sevas drop constraint sevas_frequency_check;
alter table sevas add constraint sevas_frequency_check
  check (frequency in ('nitya', 'weekly', 'monthly', 'annual', 'special', 'request'));

create table if not exists seva_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  user_id uuid references auth.users(id) on delete set null,
  seva_id text references sevas(id) on delete set null,
  -- The seva's name when asked (or the devotee's own words for "other").
  seva_name text not null,
  requested_date date not null,
  occasion text not null default '',
  devotees jsonb not null default '[]',
  phone text not null,
  email text not null default '',
  note text not null default '',
  locale text not null default 'en',
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'done', 'declined')),
  office_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seva_requests_status_date on seva_requests (status, requested_date);
create index if not exists seva_requests_user on seva_requests (user_id);
create trigger seva_requests_set_updated_at before update on seva_requests
  for each row execute function set_updated_at();
-- Server code (service role) only.
alter table seva_requests enable row level security;

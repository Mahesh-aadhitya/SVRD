-- Notice board: temple updates, ticket releases, event reminders and
-- important alerts, posted by admins and shown to devotees on /notices and
-- the home page.

create table notices (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'update'
    check (kind in ('update', 'ticket_release', 'event_reminder', 'alert')),
  title jsonb not null,
  body jsonb not null,
  -- Optional call-to-action: an in-app path ("/booking?seva=…") or https URL.
  link_url text,
  is_pinned boolean not null default false,
  -- Scheduling: hidden from devotees before publish_on and after expires_on.
  publish_on date not null default ((now() at time zone 'Asia/Kolkata')::date),
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_window_order check (expires_on is null or expires_on >= publish_on)
);
create trigger notices_set_updated_at before update on notices
  for each row execute function set_updated_at();
create index notices_publish_idx on notices(publish_on desc);

alter table notices enable row level security;
-- Scheduled notices stay private until their publish date (IST).
create policy notices_public_read on notices
  for select using (publish_on <= (now() at time zone 'Asia/Kolkata')::date);

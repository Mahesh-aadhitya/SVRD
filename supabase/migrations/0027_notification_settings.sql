-- WhatsApp alert settings (CallMeBot phone + API key), entered by admins in
-- Admin → Payments. One row. RLS on with no policies: only the service role
-- (server code) reads it, so the key never reaches a browser.
create table if not exists notification_settings (
  id int primary key default 1 check (id = 1),
  whatsapp_phone text not null default '',
  callmebot_api_key text not null default '',
  updated_at timestamptz not null default now()
);
insert into notification_settings (id) values (1) on conflict do nothing;
alter table notification_settings enable row level security;

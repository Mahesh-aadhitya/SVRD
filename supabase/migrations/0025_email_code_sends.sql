-- Sign-in codes are emailed by the site through the temple's Gmail (not by
-- Supabase Auth), so the site limits how often one address can be sent a
-- code. Only the service role reads or writes this table.
create table if not exists email_code_sends (
  id bigserial primary key,
  email text not null,
  sent_at timestamptz not null default now()
);
create index if not exists email_code_sends_email_sent_at on email_code_sends (email, sent_at desc);
alter table email_code_sends enable row level security;

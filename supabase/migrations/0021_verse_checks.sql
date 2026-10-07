-- Automatic checks on machine-drafted verse meanings (npm run verses:check):
-- each meaning is compared with published translations by a second model,
-- the Kannada is translated back to English and compared, and simple
-- mechanical checks run. Flagged verses go to the top of /admin/verses so
-- the temple reads those first; passing ones still await a final approval.

alter table verses
  add column check_status text not null default 'unchecked'
    check (check_status in ('unchecked', 'passed', 'flagged')),
  add column check_notes text[] not null default '{}',
  add column check_back_translation text,
  add column checked_by text,
  add column checked_at timestamptz;

create index verses_check_idx on verses(reviewed, check_status);

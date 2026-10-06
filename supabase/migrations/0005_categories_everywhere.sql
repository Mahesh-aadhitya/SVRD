-- Extend the content_folders category/subfolder system (already used by
-- gallery and songs) to every devotee-facing section, so admins can
-- segregate poojas, events, sevas and past live darshans by category too.

alter table content_folders drop constraint if exists content_folders_section_check;
alter table content_folders add constraint content_folders_section_check
  check (section in ('gallery', 'songs', 'poojas', 'events', 'sevas', 'live'));

-- Nullable: existing rows stay "uncategorized" and still show under "All".
-- No delete cascade — deleting a category that still has items is rejected
-- (surfaced as "folder is not empty"), same as gallery/songs.
alter table poojas add column folder_id uuid references content_folders(id);
alter table events add column folder_id uuid references content_folders(id);
alter table sevas add column folder_id uuid references content_folders(id);
alter table live_archive add column folder_id uuid references content_folders(id);

create index poojas_folder_idx on poojas(folder_id);
create index events_folder_idx on events(folder_id);
create index sevas_folder_idx on sevas(folder_id);
create index live_archive_folder_idx on live_archive(folder_id);

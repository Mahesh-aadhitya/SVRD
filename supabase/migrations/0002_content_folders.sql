-- A reusable folder hierarchy shared by every media section (gallery, songs,
-- and any future one), so admins can create subfolders under a category to
-- segregate content (e.g. gallery "Festivals" -> "Brahmotsavam 2026", or
-- songs "Bhajan" -> "Morning Bhajans").

create table content_folders (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('gallery', 'songs')),
  name text not null,
  parent_id uuid references content_folders(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index content_folders_section_parent_idx on content_folders(section, parent_id);

-- ── gallery: fold the flat `album` string into top-level "gallery" folders ─

alter table gallery_items add column folder_id uuid references content_folders(id);

insert into content_folders (section, name)
select distinct 'gallery', album from gallery_items gi
where not exists (
  select 1 from content_folders cf
  where cf.section = 'gallery' and cf.name = gi.album and cf.parent_id is null
);

update gallery_items gi
set folder_id = cf.id
from content_folders cf
where cf.section = 'gallery' and cf.name = gi.album and cf.parent_id is null and gi.folder_id is null;

alter table gallery_items alter column folder_id set not null;
alter table gallery_items drop column album;

-- ── songs: fold the flat `category` string into top-level "songs" folders ─

alter table songs add column folder_id uuid references content_folders(id);

insert into content_folders (section, name)
select distinct 'songs', category from songs s
where not exists (
  select 1 from content_folders cf
  where cf.section = 'songs' and cf.name = s.category and cf.parent_id is null
);

update songs s
set folder_id = cf.id
from content_folders cf
where cf.section = 'songs' and cf.name = s.category and cf.parent_id is null and s.folder_id is null;

alter table songs alter column folder_id set not null;
alter table songs drop column category;

-- No delete cascade on parent_id/folder_id: deleting a category that still
-- has subfolders, or a folder that still has items, is rejected by the FK
-- (the admin action surfaces this as "folder is not empty") rather than
-- silently orphaning content.

alter table content_folders enable row level security;
create policy content_folders_public_read on content_folders for select using (true);

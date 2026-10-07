-- Content fingerprints so the same file can't be uploaded twice, whatever
-- its name: content_hash is the SHA-256 of the file's bytes; image_hash is
-- a 64-bit difference hash (hex) of a photo's pixels, which also matches a
-- resized or re-compressed copy of the same picture. Existing rows are
-- filled in by scripts/backfill-media-hashes.ts.

alter table gallery_items add column if not exists content_hash text;
alter table gallery_items add column if not exists image_hash text;
alter table songs add column if not exists content_hash text;

create unique index if not exists gallery_items_content_hash_key on gallery_items (content_hash) where content_hash is not null;
create unique index if not exists songs_content_hash_key on songs (content_hash) where content_hash is not null;
create index if not exists gallery_items_youtube_id_idx on gallery_items (youtube_id) where youtube_id is not null;
create index if not exists live_archive_youtube_id_idx on live_archive (youtube_id);

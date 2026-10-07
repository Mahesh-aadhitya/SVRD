-- Why a seva can't be booked on a day: the admin can block dates inside a
-- seva's booking window with a short note ("Brahmotsavam — temple closed
-- for sevas"), which devotees see when they tap that day.
-- {"2026-10-20": "Brahmotsavam", …}
alter table sevas add column blocked_dates jsonb not null default '{}'
  check (jsonb_typeof(blocked_dates) = 'object');

-- Pictures of the Alwars and Acharyas for the panchangam's tirunakshatram
-- pages. Their life stories are part of the app; the temple adds pictures.
-- slug matches the ids in src/lib/panchang/acharyas.ts.
create table acharya_images (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  image_url text not null,
  updated_at timestamptz not null default now()
);
create trigger acharya_images_set_updated_at before update on acharya_images
  for each row execute function set_updated_at();

alter table acharya_images enable row level security;
create policy acharya_images_public_read on acharya_images for select using (true);

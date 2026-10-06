-- Poojas become Sevas: every seva has a type — nitya (daily), monthly,
-- annual, or special (darshan tickets and one-offs) — plus the details the
-- public Sevas page shows: timing, when it is performed, and a picture.
-- A seva can be listed with its details without being open for booking,
-- so listing (is_listed) and booking (is_active) are separate switches.

alter table sevas add column frequency text not null default 'special'
  check (frequency in ('nitya', 'monthly', 'annual', 'special'));
alter table sevas add column timing text not null default '';
-- {"en": "Every month on Shravana nakshatra", "kn": "…"}
alter table sevas add column schedule jsonb not null default '{"en": "", "kn": ""}';
alter table sevas add column image_url text;
alter table sevas add column is_listed boolean not null default true;

drop policy sevas_public_read on sevas;
create policy sevas_public_read on sevas for select using (is_active or is_listed);

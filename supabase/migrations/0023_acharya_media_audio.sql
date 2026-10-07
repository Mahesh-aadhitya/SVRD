-- Alwar/Acharya media: besides a picture, the temple can add a recording
-- of their composition (the site ships a few freely licensed ones; an
-- upload replaces them). Either may be empty.
alter table acharya_images rename to acharya_media;
alter trigger acharya_images_set_updated_at on acharya_media rename to acharya_media_set_updated_at;
alter policy acharya_images_public_read on acharya_media rename to acharya_media_public_read;
alter table acharya_media alter column image_url drop not null;
alter table acharya_media add column audio_url text;

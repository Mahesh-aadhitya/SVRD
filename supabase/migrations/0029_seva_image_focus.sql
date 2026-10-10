-- Where the deity's face is in a seva's photo ("50% 28%"), found by the AI
-- when the photo is saved, so cards can fill their frame with the photo
-- and crop around the face instead of cutting it off.
alter table sevas add column if not exists image_focus text;

-- The temple's name as Google Maps lists it ("Shri Varadaraja Swamy
-- Devasthana"), read from the pasted link, so the site's map and
-- directions open the temple's own listing rather than bare coordinates.
alter table temple_info add column if not exists maps_place text not null default '';
update temple_info set maps_place = 'Shri Varadaraja Swamy Devasthana' where maps_url like '%VFEt75etqXNbPJfx8%';

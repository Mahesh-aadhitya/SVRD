-- Google's unique place ID for the temple (ChIJ…), derived from the
-- feature ID in the pasted Maps link, so "Get directions" routes straight
-- to this temple — not a list of every Varadaraja Swamy temple.
alter table temple_info add column if not exists maps_place_id text not null default '';
update temple_info
set maps_place_id = 'ChIJkWHsJ43wrTsRLC11QYs-cVc',
    maps_place = 'Shri Varadaraja Swamy Devasthana, Ammavaripet Rd, Kolar, Karnataka 563101'
where maps_url like '%VFEt75etqXNbPJfx8%' or maps_url like '%ecUykBUSzDSymfdT7%';

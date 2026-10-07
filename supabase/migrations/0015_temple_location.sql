-- The temple's exact location, read from the Google Maps link (or
-- coordinates / address) the office pastes in the admin, so the map pin,
-- directions and the Panchangam's sunrise times all use the real spot.
-- maps_url keeps the link as pasted, for "Get directions".
alter table temple_info add column if not exists maps_url text not null default '';
alter table temple_info add column if not exists lat double precision;
alter table temple_info add column if not exists lon double precision;

-- Timings rows gain a Kannada day label and structured sessions:
-- [{ "day": "Daily", "dayKn": "ಪ್ರತಿದಿನ", "sessions": [{ "open": "06:00", "close": "12:00" }], "hours": "6:00 AM – 12:00 PM" }]
-- Older rows with only day/hours keep working.

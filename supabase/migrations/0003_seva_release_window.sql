-- Ticket "release" needs a date window (start/end), not just a blanket
-- on/off toggle — matches how temples actually open seva booking for a
-- specific date range at a time.

alter table sevas add column release_start_date date;
alter table sevas add column release_end_date date;

alter table sevas add constraint sevas_release_window_order
  check (release_end_date is null or release_start_date is null or release_end_date >= release_start_date);

-- Sevas already marked active (from the initial seed) get a default 30-day
-- window starting today, so they don't silently stop being bookable.
update sevas
set release_start_date = current_date,
    release_end_date = current_date + 30
where is_active and release_start_date is null;

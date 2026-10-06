-- Ticket releases beyond one continuous window: a single week, chosen
-- weekdays within a window (e.g. every Saturday & Sunday), or a hand-picked
-- set of dates. release_start_date/release_end_date stay the outer bounds
-- in every mode, so existing range checks keep working.

alter table sevas add column release_mode text not null default 'range'
  check (release_mode in ('range', 'week', 'weekdays', 'dates'));
-- 0 = Sunday … 6 = Saturday (matches extract(dow) and JS getDay()).
alter table sevas add column release_weekdays smallint[];
alter table sevas add column release_dates date[];

-- Same as 0004's create_booking, plus the weekday / specific-date checks.
create or replace function create_booking(
  p_seva_id text,
  p_date date,
  p_name text,
  p_phone text
)
returns table (booking_id uuid, booking_reference text, booking_status text, booking_amount int)
language plpgsql
security definer
set search_path = public
as $$
declare
  s sevas%rowtype;
  booked int;
  ref text;
  new_status text;
  new_id uuid;
begin
  select * into s from sevas where id = p_seva_id for update;
  if not found or not s.is_active then
    raise exception 'seva_unavailable';
  end if;

  if s.release_start_date is null
    or s.release_end_date is null
    or p_date < s.release_start_date
    or p_date > s.release_end_date
    or p_date < (now() at time zone 'Asia/Kolkata')::date
    or (s.release_mode = 'weekdays' and not (extract(dow from p_date)::smallint = any (coalesce(s.release_weekdays, '{}'))))
    or (s.release_mode = 'dates' and not (p_date = any (coalesce(s.release_dates, '{}')))) then
    raise exception 'date_unavailable';
  end if;

  select count(*) into booked
  from bookings
  where seva_id = p_seva_id and booking_date = p_date and status <> 'cancelled';
  if booked >= s.capacity_per_slot then
    raise exception 'slot_full';
  end if;

  loop
    ref := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from bookings where reference = ref);
  end loop;

  new_status := case when s.price = 0 then 'confirmed' else 'pending' end;

  insert into bookings (seva_id, booking_date, devotee_name, phone, amount, status, reference)
  values (p_seva_id, p_date, p_name, p_phone, s.price, new_status, ref)
  returning id into new_id;

  return query select new_id, ref, new_status, s.price;
end;
$$;

revoke execute on function create_booking(text, date, text, text) from public, anon, authenticated;
grant execute on function create_booking(text, date, text, text) to service_role;

-- Same-day bookings close at 3 PM temple time (src/lib/seva-types.ts
-- SAME_DAY_CUTOFF says the same for the pages).
CREATE OR REPLACE FUNCTION public.create_booking(p_seva_id text, p_date date, p_phone text, p_devotees jsonb, p_slot_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(booking_id uuid, booking_reference text, booking_status text, booking_amount integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  s sevas%rowtype;
  sl seva_slots%rowtype;
  has_slots boolean;
  capacity int;
  booked int;
  ref text;
  new_status text;
  new_id uuid;
  total int;
  qty int;
  now_ist timestamp := now() at time zone 'Asia/Kolkata';
begin
  -- One devotee per ticket, 1–6 of them, each with a name.
  if p_devotees is null or jsonb_typeof(p_devotees) <> 'array' then
    raise exception 'invalid_devotees';
  end if;
  qty := jsonb_array_length(p_devotees);
  if qty < 1 or qty > 6
    or exists (
      select 1 from jsonb_array_elements(p_devotees) d
      where coalesce(length(trim(d->>'name')), 0) < 2
         or length(d->>'name') > 100
         or coalesce(length(d->>'gotram'), 0) > 60
         or coalesce(length(d->>'nakshatram'), 0) > 40
    ) then
    raise exception 'invalid_devotees';
  end if;

  -- Locking the seva row serializes every booking for this seva.
  select * into s from sevas where id = p_seva_id for update;
  if not found or not s.is_active then
    raise exception 'seva_unavailable';
  end if;

  if s.frequency = 'request' then
    -- Sevas on request are booked for any allowed day: at least book_min_days
    -- ahead (time to prepare), at most book_max_days ahead, only on the
    -- chosen weekdays (none chosen = every day), never on a blocked day.
    if p_date < now_ist::date + s.book_min_days
      or p_date > now_ist::date + s.book_max_days
      or (coalesce(array_length(s.release_weekdays, 1), 0) > 0
          and not (extract(dow from p_date)::smallint = any (s.release_weekdays)))
      or s.blocked_dates ? p_date::text then
      raise exception 'date_unavailable';
    end if;
  elsif s.release_start_date is null
    or s.release_end_date is null
    or p_date < s.release_start_date
    or p_date > s.release_end_date
    or p_date < now_ist::date
    or (s.release_mode = 'weekdays' and not (extract(dow from p_date)::smallint = any (coalesce(s.release_weekdays, '{}'))))
    or (s.release_mode = 'dates' and not (p_date = any (coalesce(s.release_dates, '{}')))) then
    raise exception 'date_unavailable';
  end if;

  -- Same-day bookings close at 3 PM temple time.
  if p_date = now_ist::date and now_ist::time >= time '15:00' then
    raise exception 'date_unavailable';
  end if;

  select exists (select 1 from seva_slots where seva_id = p_seva_id and is_active) into has_slots;

  if has_slots then
    if p_slot_id is null then
      raise exception 'slot_required';
    end if;
    select * into sl from seva_slots where id = p_slot_id and seva_id = p_seva_id and is_active;
    if not found then
      raise exception 'slot_unavailable';
    end if;
    if p_date = now_ist::date and sl.start_time <= now_ist::time then
      raise exception 'slot_unavailable';
    end if;
    capacity := sl.capacity;
    select coalesce(sum(quantity), 0) into booked from bookings
    where seva_id = p_seva_id and booking_date = p_date and slot_id = p_slot_id and status <> 'cancelled';
  else
    p_slot_id := null;
    capacity := s.capacity_per_slot;
    select coalesce(sum(quantity), 0) into booked from bookings
    where seva_id = p_seva_id and booking_date = p_date and status <> 'cancelled';
  end if;

  if booked + qty > capacity then
    raise exception 'slot_full';
  end if;

  loop
    ref := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from bookings where reference = ref);
  end loop;

  new_status := case when s.price = 0 then 'confirmed' else 'pending' end;
  total := s.price * qty;

  insert into bookings (seva_id, booking_date, slot_id, devotee_name, phone, quantity, devotees, amount, status, reference)
  values (p_seva_id, p_date, p_slot_id, trim(p_devotees->0->>'name'), p_phone, qty, p_devotees, total, new_status, ref)
  returning id into new_id;

  return query select new_id, ref, new_status, total;
end;
$function$;

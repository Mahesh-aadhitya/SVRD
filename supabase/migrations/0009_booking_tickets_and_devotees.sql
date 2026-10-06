-- One booking can hold 1–6 tickets (e.g. a family), with each devotee's
-- name and optional gotram / nakshatram recorded for the sankalpam.
-- Capacity is counted in tickets, not bookings; amount = price × tickets.

alter table bookings add column quantity int not null default 1
  constraint bookings_quantity_range check (quantity between 1 and 6);

-- [{ "name": "…", "gotram": "…" | null, "nakshatram": "Rohini" | null }, …]
-- one entry per ticket. devotee_name keeps the first devotee (the contact).
alter table bookings add column devotees jsonb not null default '[]'
  constraint bookings_devotees_is_array check (jsonb_typeof(devotees) = 'array');

drop function if exists create_booking(text, date, text, text, uuid);

create function create_booking(
  p_seva_id text,
  p_date date,
  p_phone text,
  p_devotees jsonb,
  p_slot_id uuid default null
)
returns table (booking_id uuid, booking_reference text, booking_status text, booking_amount int)
language plpgsql
security definer
set search_path = public
as $$
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

  if s.release_start_date is null
    or s.release_end_date is null
    or p_date < s.release_start_date
    or p_date > s.release_end_date
    or p_date < now_ist::date
    or (s.release_mode = 'weekdays' and not (extract(dow from p_date)::smallint = any (coalesce(s.release_weekdays, '{}'))))
    or (s.release_mode = 'dates' and not (p_date = any (coalesce(s.release_dates, '{}')))) then
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
$$;

revoke execute on function create_booking(text, date, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function create_booking(text, date, text, jsonb, uuid) to service_role;

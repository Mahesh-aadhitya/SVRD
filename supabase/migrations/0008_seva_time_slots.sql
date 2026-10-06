-- Time slots per seva (e.g. 6:30–7:30 AM, 7:00–8:00 PM), each with its own
-- capacity. Bookings pick a slot; capacity is counted per (seva, date, slot).
-- A seva with no active slots keeps the old whole-day booking behaviour,
-- using sevas.capacity_per_slot.

create table seva_slots (
  id uuid primary key default gen_random_uuid(),
  seva_id text not null references sevas(id) on delete cascade,
  start_time time not null,
  end_time time,
  capacity int not null check (capacity >= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint seva_slots_time_order check (end_time is null or end_time > start_time)
);
create index seva_slots_seva_idx on seva_slots(seva_id, start_time);

alter table seva_slots enable row level security;
create policy seva_slots_public_read on seva_slots for select using (is_active);

-- No cascade: a slot with bookings can't be deleted, only deactivated.
alter table bookings add column slot_id uuid references seva_slots(id);
create index bookings_seva_date_slot_idx on bookings(seva_id, booking_date, slot_id)
  where status <> 'cancelled';

-- New signature (adds p_slot_id), so replace rather than overload.
drop function if exists create_booking(text, date, text, text);

create function create_booking(
  p_seva_id text,
  p_date date,
  p_name text,
  p_phone text,
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
  now_ist timestamp := now() at time zone 'Asia/Kolkata';
begin
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
    -- Today's slots close once they've started.
    if p_date = now_ist::date and sl.start_time <= now_ist::time then
      raise exception 'slot_unavailable';
    end if;
    capacity := sl.capacity;
    select count(*) into booked from bookings
    where seva_id = p_seva_id and booking_date = p_date and slot_id = p_slot_id and status <> 'cancelled';
  else
    p_slot_id := null;
    capacity := s.capacity_per_slot;
    select count(*) into booked from bookings
    where seva_id = p_seva_id and booking_date = p_date and status <> 'cancelled';
  end if;

  if booked >= capacity then
    raise exception 'slot_full';
  end if;

  loop
    ref := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from bookings where reference = ref);
  end loop;

  new_status := case when s.price = 0 then 'confirmed' else 'pending' end;

  insert into bookings (seva_id, booking_date, slot_id, devotee_name, phone, amount, status, reference)
  values (p_seva_id, p_date, p_slot_id, p_name, p_phone, s.price, new_status, ref)
  returning id into new_id;

  return query select new_id, ref, new_status, s.price;
end;
$$;

revoke execute on function create_booking(text, date, text, text, uuid) from public, anon, authenticated;
grant execute on function create_booking(text, date, text, text, uuid) to service_role;

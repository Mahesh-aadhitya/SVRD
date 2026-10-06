-- Temple contact/timings/about become admin-editable data instead of a
-- hardcoded object, and devotee bookings go live through one atomic,
-- capacity-checked function.

-- ── Temple info (singleton row, same pattern as live_config) ─────────────

create table temple_info (
  id boolean primary key default true check (id),
  address_line1 text not null default '',
  address_line2 text not null default '',
  phone text not null default '',
  email text not null default '',
  maps_query text not null default '',
  about jsonb not null default '{"en": "", "kn": ""}',
  -- [{ "day": "Mon – Fri", "hours": "5:30 AM – 9:00 PM" }, ...]
  timings jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
create trigger temple_info_set_updated_at before update on temple_info
  for each row execute function set_updated_at();
insert into temple_info (id) values (true);

alter table temple_info enable row level security;
create policy temple_info_public_read on temple_info for select using (true);

-- ── Bookings ─────────────────────────────────────────────────────────────

-- Short human-readable code the devotee shows at the temple counter.
alter table bookings add column reference text unique;

-- Locks the seva row so concurrent bookings for the same seva are
-- serialized, then re-checks the release window and remaining capacity
-- before inserting — two devotees can't both take the last slot.
-- Only the service role may call it (from the createBooking Server Action,
-- which validates input first).
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

  -- India is UTC+5:30, so compare against the IST calendar date.
  if s.release_start_date is null
    or s.release_end_date is null
    or p_date < s.release_start_date
    or p_date > s.release_end_date
    or p_date < (now() at time zone 'Asia/Kolkata')::date then
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

  -- Free sevas are confirmed immediately; paid ones wait for the admin to
  -- record payment at the counter.
  new_status := case when s.price = 0 then 'confirmed' else 'pending' end;

  insert into bookings (seva_id, booking_date, devotee_name, phone, amount, status, reference)
  values (p_seva_id, p_date, p_name, p_phone, s.price, new_status, ref)
  returning id into new_id;

  return query select new_id, ref, new_status, s.price;
end;
$$;

revoke execute on function create_booking(text, date, text, text) from public, anon, authenticated;
grant execute on function create_booking(text, date, text, text) to service_role;

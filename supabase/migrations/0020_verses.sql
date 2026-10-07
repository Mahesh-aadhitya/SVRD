-- The panchangam's verse of the day: the Bhagavad Gita, the Vishnu
-- Sahasranama and the Nalayira Divya Prabandham, each with its meaning in
-- English and Kannada. Meanings drafted by machine stay "unreviewed" until
-- an admin reads and approves them in /admin/verses.
--
-- Every day's verse is recorded in verse_days, and a new day always gets a
-- verse shown the fewest times so far, so no verse repeats until every
-- other one has been read — even as more verses are added.

create table verses (
  id text primary key,
  collection text not null check (collection in ('bg', 'vs', 'dp')),
  source jsonb not null, -- { en, kn }: "Bhagavad Gita 2.47"
  text_kn text not null, -- the verse in Kannada script
  roman text not null,
  tamil text,
  meaning jsonb not null, -- { en, kn }
  -- Kept for one occasion (Gita Jayanti, Rama Navami, …) and never shown
  -- in the daily rotation.
  occasion text unique,
  -- Spreads the three collections evenly through the rotation.
  sort double precision not null default 0,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger verses_set_updated_at before update on verses
  for each row execute function set_updated_at();
create index verses_review_idx on verses(reviewed, collection, sort);

alter table verses enable row level security;
create policy verses_public_read on verses for select using (true);

create table verse_days (
  day date primary key,
  verse_id text not null references verses(id) on delete cascade
);
create index verse_days_verse_idx on verse_days(verse_id, day);
-- No policies: read and written only through verse_for_day().
alter table verse_days enable row level security;

-- The verse for a day. Days around today (IST) are recorded the first time
-- they're asked for; other dates get a preview that isn't saved, so browsing
-- far ahead never uses verses up.
create or replace function verse_for_day(d date, occasion_key text default null)
returns setof verses
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
  chosen text;
  pool int;
begin
  if occasion_key is not null then
    return query select * from verses where occasion = occasion_key;
    if found then return; end if;
  end if;

  select verse_id into chosen from verse_days where day = d;

  if chosen is null then
    select greatest(count(*) - 3, 1) into pool from verses where occasion is null;
    -- Fewest showings first, then the longest since last shown; among
    -- unseen verses, the rotation order. Never the verse of a neighbouring day.
    select v.id into chosen
    from verses v
    left join (select verse_id, count(*) as shown, max(day) as last_day from verse_days group by verse_id) s
      on s.verse_id = v.id
    where v.occasion is null
      and v.id not in (select verse_id from verse_days where day between d - 1 and d + 1)
    order by coalesce(s.shown, 0), s.last_day nulls first, v.sort, v.id
    offset case when d between today - 1 and today + 1 then 0 else (abs(d - today) - 1) % pool end
    limit 1;

    if chosen is null then return; end if;

    if d between today - 1 and today + 1 then
      insert into verse_days (day, verse_id) values (d, chosen) on conflict (day) do nothing;
      select verse_id into chosen from verse_days where day = d;
    end if;
  end if;

  return query select * from verses where id = chosen;
end;
$$;

revoke all on function verse_for_day(date, text) from public;
grant execute on function verse_for_day(date, text) to anon, authenticated, service_role;

"use client";

import { useActionState, useState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { saveSeva } from "@/lib/actions/sevas";
import { formatSlot, isReleasedOn, SEVA_FREQUENCIES, type Seva, type SevaFrequency } from "@/lib/seva-types";
import ImageUploadField from "@/components/admin/ImageUploadField";
import type { FolderTree } from "@/lib/folders";
import { formatIso, isoFromDate, localTodayIso, parseIso } from "@/lib/dates";
import CategorySelect from "@/components/admin/CategorySelect";
import BilingualField from "@/components/admin/BilingualField";
import Calendar from "@/components/calendar/Calendar";
import { rebalance, setSlotCount, splitEvenly } from "@/lib/slot-split";
import type { ImportantDay } from "@/lib/panchang/important-days";
import type { CalendarCategory } from "@/lib/panchang/year";

type SlotDraft = { key: string; id?: string; startTime: string; endTime: string; capacity: number; locked: boolean };

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-gold";

// Every open date of an existing seva, whatever pattern it was released
// with, as an explicit list the admin can tap on the calendar.
function openDatesOf(seva: Seva | undefined, today: string) {
  if (!seva?.releaseStartDate || !seva.releaseEndDate) return [];
  const dates: string[] = [];
  const from = seva.releaseStartDate > today ? seva.releaseStartDate : today;
  for (const d = parseIso(from); isoFromDate(d) <= seva.releaseEndDate && dates.length < 400; d.setDate(d.getDate() + 1)) {
    const iso = isoFromDate(d);
    if (isReleasedOn(seva, iso)) dates.push(iso);
  }
  return dates;
}

function addDays(iso: string, days: number) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

function daysBetween(from: string, to: string, keep: (d: Date) => boolean = () => true) {
  const out: string[] = [];
  for (const d = parseIso(from); isoFromDate(d) <= to; d.setDate(d.getDate() + 1)) if (keep(d)) out.push(isoFromDate(d));
  return out;
}

function endOfMonth(iso: string, monthsAhead = 0) {
  const d = parseIso(iso);
  return isoFromDate(new Date(d.getFullYear(), d.getMonth() + 1 + monthsAhead, 0));
}

function startOfMonth(iso: string, monthsAhead: number) {
  const d = parseIso(iso);
  return isoFromDate(new Date(d.getFullYear(), d.getMonth() + monthsAhead, 1));
}

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

// Festival marks on the booking calendar, by kind of day.
const MARK_COLOR: Record<CalendarCategory, string> = {
  temple: "#b8862f",
  festival: "#ea580c",
  tirunakshatram: "#c026d3",
  important: "#0284c7",
  grahana: "#e11d48",
  tirumala: "#059669",
};
const MARK_LABEL: Partial<Record<CalendarCategory, string>> = {
  temple: "Our temple utsava",
  festival: "Festival",
  important: "Ekadashi, Purnima & holy days",
  tirunakshatram: "Alwar / Acharya tirunakshatram",
  grahana: "Grahana (eclipse)",
};
const BLOCKED_DAY = "bg-red-50 text-red-700 line-through decoration-red-300 ring-1 ring-inset ring-red-300 hover:bg-red-100";
const short = (iso: string) => formatIso(iso, "en", { weekday: "short", day: "numeric", month: "short" });

const FREQUENCY_CHOICES: Record<SevaFrequency, { title: string; hint: string; schedule: string }> = {
  nitya: { title: "Nitya seva", hint: "Performed every day", schedule: "e.g. Every day" },
  monthly: { title: "Monthly seva", hint: "Once a month", schedule: "e.g. Every month on Shravana nakshatra" },
  annual: { title: "Annual seva", hint: "Once a year / festival", schedule: "e.g. Once a year on Vaikunta Ekadashi" },
  special: { title: "Darshan & special", hint: "Darshan tickets, one-off sevas", schedule: "e.g. On selected dates" },
};

export default function SevaForm({
  seva,
  categories,
  importantDays = {},
}: {
  seva?: Seva;
  categories: FolderTree;
  /** Festivals and holy days ahead, marked on the booking calendar. */
  importantDays?: Record<string, ImportantDay[]>;
}) {
  const locale = useLocale() as Locale;
  const today = localTodayIso();
  const [state, formAction, pending] = useActionState(saveSeva.bind(null, seva?.id ?? null, locale), undefined);

  const activeSlots = (seva?.slots ?? []).filter((s) => s.isActive);
  const [useSlots, setUseSlots] = useState(activeSlots.length > 0);
  const [slots, setSlots] = useState<SlotDraft[]>(
    activeSlots.map((s) => ({ key: s.id, id: s.id, startTime: s.startTime, endTime: s.endTime ?? "", capacity: s.capacity, locked: true })),
  );
  // Tickets per day is fixed; time slots share it (their counts always add up to it).
  const [dayTotal, setDayTotal] = useState(() =>
    activeSlots.length > 0 ? activeSlots.reduce((sum, s) => sum + s.capacity, 0) : (seva?.capacityPerSlot ?? 20),
  );
  const [totalDraft, setTotalDraft] = useState(String(dayTotal));

  const changeTotal = (raw: string) => {
    setTotalDraft(raw);
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n) || n < Math.max(1, useSlots ? slots.length : 1)) return;
    setDayTotal(n);
    if (useSlots) setSlots((all) => rebalance(all, n));
  };
  const addSlot = () => {
    if (slots.length >= dayTotal) return;
    setSlots((all) => rebalance([...all, { key: crypto.randomUUID(), startTime: "", endTime: "", capacity: 0, locked: false }], dayTotal));
  };
  const removeSlot = (key: string) => setSlots((all) => rebalance(all.filter((s) => s.key !== key), dayTotal));
  const [dates, setDates] = useState<string[]>(() => openDatesOf(seva, today));
  const [open, setOpen] = useState(seva ? seva.isActive : true);
  const [frequency, setFrequency] = useState<SevaFrequency>(seva?.frequency ?? "nitya");
  const [listed, setListed] = useState(seva ? seva.isListed : true);

  const dateSet = new Set(dates);
  // Days closed inside the booking window, each with the reason devotees see.
  const [blocked, setBlocked] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(seva?.blockedDates ?? {}).filter(([d]) => d >= today)),
  );
  const [tapMode, setTapMode] = useState<"open" | "block">("open");
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const unblock = (iso: string) =>
    setBlocked((prev) => {
      if (!(iso in prev)) return prev;
      const { [iso]: _removed, ...rest } = prev; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    });
  const block = (iso: string) => {
    setDates((prev) => prev.filter((d) => d !== iso));
    setBlocked((prev) => (iso in prev ? prev : { ...prev, [iso]: "" }));
    setFocusDate(iso);
  };
  const toggleDate = (iso: string) => {
    if (tapMode === "block") {
      if (iso in blocked) unblock(iso);
      else block(iso);
      return;
    }
    unblock(iso);
    setDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()));
  };
  const addDates = (more: string[]) => {
    const add = more.filter((d) => !(d in blocked));
    setDates((prev) => [...new Set([...prev, ...add])].sort());
  };
  const openDate = (iso: string) => {
    unblock(iso);
    setDates((prev) => [...new Set([...prev, iso])].sort());
  };

  const quickPicks: { label: string; dates: () => string[] }[] = [
    { label: "Next 7 days", dates: () => daysBetween(today, addDays(today, 6)) },
    { label: "Next 30 days", dates: () => daysBetween(today, addDays(today, 29)) },
    { label: "Rest of this month", dates: () => daysBetween(today, endOfMonth(today)) },
    { label: "Weekends this month", dates: () => daysBetween(today, endOfMonth(today), isWeekend) },
    {
      label: "Weekends next month",
      dates: () => daysBetween(startOfMonth(today, 1), endOfMonth(today, 1), isWeekend),
    },
  ];

  const slotsPayload = useSlots
    ? slots.map(({ id, startTime, endTime, capacity }) => ({ id, startTime, endTime, capacity }))
    : [];
  const nextDate = dates.find((d) => d >= today);
  const blockedList = Object.keys(blocked).sort();
  // Unselected days between the first and last open dates: closed, and worth a reason.
  const gaps = dates.length > 1 ? daysBetween(dates[0], dates.at(-1)!).filter((d) => !dateSet.has(d) && !(d in blocked)) : [];
  const upcomingImportant = Object.keys(importantDays)
    .filter((d) => d >= today && d <= addDays(today, 120))
    .sort()
    .slice(0, 14);
  const usedCategories = [...new Set(Object.values(importantDays).flat().map((d) => d.category))];

  return (
    <form action={formAction} className="max-w-4xl space-y-6 pb-24">
      <input type="hidden" name="slots" value={JSON.stringify(slotsPayload)} />
      <input type="hidden" name="dates" value={JSON.stringify(dates)} />
      <input type="hidden" name="blocked" value={JSON.stringify(blocked)} />

      {/* 1 — Details */}
      <Section step={1} title="Seva details">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink/70">Type of seva</p>
            <input type="hidden" name="frequency" value={frequency} />
            <div className="mt-1.5 flex flex-wrap gap-2">
              {SEVA_FREQUENCIES.map((f) => (
                <Choice key={f} active={frequency === f} onClick={() => setFrequency(f)} title={FREQUENCY_CHOICES[f].title} hint={FREQUENCY_CHOICES[f].hint} />
              ))}
            </div>
          </div>
          <BilingualField label="Name" enName="nameEn" knName="nameKn" defaultEn={seva?.name.en} defaultKn={seva?.name.kn} required />
          <BilingualField
            label="Description"
            enName="descriptionEn"
            knName="descriptionKn"
            defaultEn={seva?.description.en}
            defaultKn={seva?.description.kn}
            required
            multiline
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-ink/70" htmlFor="price">
                Ticket price (₹)
              </label>
              <input id="price" name="price" type="number" min={0} defaultValue={seva?.price ?? 0} className={`mt-1.5 ${inputClass}`} />
              <p className="mt-1 text-xs text-ink/45">Enter 0 for a free seva.</p>
            </div>
            <CategorySelect categories={categories} defaultValue={seva?.folderId} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
            <div>
              <label className="text-sm font-medium text-ink/70" htmlFor="timing">
                Timing shown to devotees
              </label>
              <input id="timing" name="timing" maxLength={120} defaultValue={seva?.timing} placeholder="e.g. 5:30 AM – 6:15 AM" className={`mt-1.5 ${inputClass}`} />
            </div>
            <BilingualField
              label="When it is performed"
              enName="scheduleEn"
              knName="scheduleKn"
              defaultEn={seva?.schedule.en}
              defaultKn={seva?.schedule.kn}
              placeholder={FREQUENCY_CHOICES[frequency].schedule}
            />
          </div>
          <ImageUploadField name="image" prefix="sevas" defaultValue={seva?.imageUrl} label="Seva picture" />
          <label className="flex items-center justify-between gap-4 rounded-xl bg-white/70 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-ink">Show on the Sevas page</span>
              <span className="block text-xs text-ink/55">Devotees see the details even when booking is closed.</span>
            </span>
            <input type="checkbox" name="listed" checked={listed} onChange={(e) => setListed(e.target.checked)} className="peer sr-only" />
            <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-black/15 transition-colors peer-checked:bg-maroon peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${listed ? "translate-x-6" : "translate-x-1"}`} />
            </span>
          </label>
        </div>
      </Section>

      {/* 2 — Timings */}
      <Section step={2} title="Timings & devotees">
        <div className="flex flex-wrap gap-2">
          <Choice active={!useSlots} onClick={() => setUseSlots(false)} title="Any time that day" hint="One booking per devotee for the day" />
          <Choice
            active={useSlots}
            onClick={() => {
              setUseSlots(true);
              if (slots.length === 0)
                setSlots([{ key: crypto.randomUUID(), startTime: "06:00", endTime: "07:00", capacity: dayTotal, locked: false }]);
              else if (slots.length <= dayTotal) setSlots((all) => rebalance(all, dayTotal));
            }}
            title="Specific time slots"
            hint="e.g. 6:00 AM and 7:00 PM batches"
          />
        </div>

        <div className="mt-4 max-w-xs">
          <label className="text-sm font-medium text-ink/70" htmlFor="dayTotal">
            Total tickets per day
          </label>
          <input
            id="dayTotal"
            type="number"
            min={Math.max(1, useSlots ? slots.length : 1)}
            required
            value={totalDraft}
            onChange={(e) => changeTotal(e.target.value)}
            onBlur={() => setTotalDraft(String(dayTotal))}
            className={`mt-1.5 ${inputClass}`}
          />
          <input type="hidden" name="dayCapacity" value={dayTotal} />
          {useSlots ? <p className="mt-1 text-xs text-ink/45">Shared across the time slots below — the total never changes when you add slots.</p> : null}
        </div>

        {useSlots ? (
          <div className="mt-5">
            <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 px-1 text-xs font-medium text-ink/55 sm:grid">
              <span>Starts at</span>
              <span>Ends at (optional)</span>
              <span>Tickets in this slot</span>
              <span className="w-8" />
            </div>
            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div key={slot.key} className="grid grid-cols-2 gap-2 rounded-xl border border-ink/10 bg-white/60 p-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0">
                  <input
                    type="time"
                    required
                    aria-label="Starts at"
                    value={slot.startTime}
                    onChange={(e) => setSlots((all) => all.map((s) => (s.key === slot.key ? { ...s, startTime: e.target.value } : s)))}
                    className={inputClass}
                  />
                  <input
                    type="time"
                    aria-label="Ends at"
                    value={slot.endTime}
                    onChange={(e) => setSlots((all) => all.map((s) => (s.key === slot.key ? { ...s, endTime: e.target.value } : s)))}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={1}
                    max={dayTotal - (slots.length - 1)}
                    required
                    aria-label="Tickets in this slot"
                    value={slot.capacity}
                    onChange={(e) => setSlots((all) => setSlotCount(all, index, Number(e.target.value), dayTotal))}
                    className={`${inputClass} ${slot.locked && slots.length > 1 ? "border-maroon/50" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.key)}
                    aria-label="Remove time slot"
                    className="flex h-10 w-full items-center justify-center rounded-xl text-red-600 hover:bg-red-500/10 sm:w-10"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addSlot}
                disabled={slots.length >= dayTotal}
                className="rounded-full border border-maroon/30 px-4 py-2 text-sm font-semibold text-maroon hover:bg-maroon/5 disabled:opacity-40"
              >
                + Add another time
              </button>
              {slots.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSlots((all) => splitEvenly(all, dayTotal))}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5"
                >
                  Split evenly
                </button>
              ) : null}
              <span className="text-xs text-ink/55">
                {slots.reduce((sum, s) => sum + s.capacity, 0)} of {dayTotal} tickets assigned
              </span>
            </div>
            {slots.length > 1 ? (
              <p className="mt-1 text-xs text-ink/45">
                Change any slot and the others adjust automatically. Slots you&apos;ve set yourself (outlined) are kept.
              </p>
            ) : null}
            {slots.some((s) => s.startTime) ? (
              <p className="mt-2 text-xs text-ink/50">
                Devotees will choose from:{" "}
                {slots
                  .filter((s) => s.startTime)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => formatSlot({ startTime: s.startTime, endTime: s.endTime || null }, "en"))
                  .join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </Section>

      {/* 3 — Booking dates */}
      <Section step={3} title="Booking dates">
        <label className="flex items-center justify-between gap-4 rounded-xl bg-white/70 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-ink">Open for booking</span>
            <span className="block text-xs text-ink/55">Turn off to stop new bookings without losing your dates.</span>
          </span>
          <input type="checkbox" name="openForBooking" checked={open} onChange={(e) => setOpen(e.target.checked)} className="peer sr-only" />
          <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-black/15 transition-colors peer-checked:bg-maroon peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${open ? "translate-x-6" : "translate-x-1"}`} />
          </span>
        </label>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div>
            <div role="radiogroup" aria-label="What a tap does" className="mb-2 grid grid-cols-2 gap-1 rounded-full bg-black/[0.05] p-1 text-xs font-semibold">
              {(
                [
                  ["open", "Tap to open for booking"],
                  ["block", "Tap to block with a note"],
                ] as const
              ).map(([mode, text]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={tapMode === mode}
                  onClick={() => setTapMode(mode)}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    tapMode === mode ? (mode === "open" ? "bg-maroon text-cream shadow" : "bg-red-600 text-white shadow") : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs text-ink/55">
              {tapMode === "open"
                ? "Tap the days devotees can book. Tap again to remove."
                : "Tap a day to close it and write why — devotees see the reason. Tap again to unblock."}
            </p>
            <Calendar
              locale={locale}
              onSelect={toggleDate}
              isSelected={(iso) => dateSet.has(iso)}
              dayClassName={(iso) => (iso in blocked ? BLOCKED_DAY : undefined)}
              dayMark={(iso) => {
                const marks = importantDays[iso];
                return marks?.length ? { colors: [...new Set(marks.map((m) => MARK_COLOR[m.category]))], title: marks.map((m) => m.name).join(" · ") } : null;
              }}
            />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink/60">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-maroon" /> Open
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-red-100 ring-1 ring-red-300" /> Blocked
              </span>
              {usedCategories.map((c) =>
                MARK_LABEL[c] ? (
                  <span key={c} className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MARK_COLOR[c] }} /> {MARK_LABEL[c]}
                  </span>
                ) : null,
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ink/70">Quick select</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickPicks.map((pick) => (
                  <button
                    key={pick.label}
                    type="button"
                    onClick={() => addDates(pick.dates())}
                    className="rounded-full border border-gold/50 bg-white/70 px-3 py-1.5 text-xs font-semibold text-maroon hover:border-maroon/50"
                  >
                    + {pick.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-ink/10 bg-white/70 p-4">
              {dates.length === 0 ? (
                <p className="text-sm text-ink/50">No dates selected yet.</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-maroon">
                    {dates.length} day{dates.length === 1 ? "" : "s"} open for booking
                    {blockedList.length ? <span className="font-normal text-red-700"> · {blockedList.length} blocked</span> : null}
                  </p>
                  {nextDate ? (
                    <p className="mt-0.5 text-xs text-ink/55">
                      First: {short(nextDate)} · Last:{" "}
                      {formatIso(dates.at(-1)!, "en", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  ) : null}
                  <button type="button" onClick={() => setDates([])} className="mt-2 text-xs font-semibold text-red-600 hover:underline">
                    Clear all dates
                  </button>
                </>
              )}
            </div>

            {/* Blocked days and their reasons */}
            {blockedList.length || gaps.length ? (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <p className="text-sm font-semibold text-red-800">Blocked days</p>
                <p className="mt-0.5 text-xs text-ink/55">Devotees see this note when they tap the day on the booking calendar.</p>
                {blockedList.length ? (
                  <ul className="mt-3 space-y-2">
                    {blockedList.map((iso) => (
                      <li key={iso} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        <span className="w-28 shrink-0 text-xs font-semibold text-ink/75">
                          {short(iso)}
                          {importantDays[iso] ? <span className="block font-normal text-ink/45">{importantDays[iso][0].name}</span> : null}
                        </span>
                        <input
                          value={blocked[iso]}
                          maxLength={160}
                          autoFocus={focusDate === iso}
                          onChange={(e) => setBlocked((prev) => ({ ...prev, [iso]: e.target.value }))}
                          placeholder="Why it's closed, e.g. Brahmotsavam — no sevas"
                          aria-label={`Reason ${iso} is blocked`}
                          className={`${inputClass} min-w-0 flex-1 py-2`}
                        />
                        <button
                          type="button"
                          onClick={() => openDate(iso)}
                          className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold text-maroon hover:bg-maroon/5"
                        >
                          Open instead
                        </button>
                        <button
                          type="button"
                          onClick={() => unblock(iso)}
                          aria-label={`Unblock ${iso}`}
                          className="h-8 w-8 shrink-0 rounded-full text-red-600 hover:bg-red-500/10"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {gaps.length ? (
                  <div className="mt-3">
                    <p className="text-xs text-ink/60">
                      {gaps.length} day{gaps.length === 1 ? "" : "s"} in between {gaps.length === 1 ? "is" : "are"} closed without a reason — tap one to add a note:
                    </p>
                    <div className="mt-1.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                      {gaps.slice(0, 60).map((iso) => (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => block(iso)}
                          className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:border-red-400"
                        >
                          + {short(iso)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Festivals ahead, so the admin can open or close them on purpose */}
            {upcomingImportant.length ? (
              <div className="rounded-xl border border-gold/40 bg-cream/60 p-4">
                <p className="text-sm font-semibold text-maroon">Important days ahead</p>
                <ul className="mt-2 divide-y divide-gold/20">
                  {upcomingImportant.map((iso) => {
                    const isOpen = dateSet.has(iso);
                    const isBlocked = iso in blocked;
                    return (
                      <li key={iso} className="flex items-center gap-3 py-2">
                        <span className="w-24 shrink-0 text-xs font-semibold text-ink/70">{short(iso)}</span>
                        <span className="min-w-0 flex-1 text-xs text-ink/80">
                          {importantDays[iso].map((m, i) => (
                            <span key={i} className="mr-2 inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: MARK_COLOR[m.category] }} />
                              {m.name}
                            </span>
                          ))}
                        </span>
                        {isOpen ? (
                          <span className="shrink-0 rounded-full bg-maroon/10 px-2 py-0.5 text-[11px] font-semibold text-maroon">Open</span>
                        ) : isBlocked ? (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Blocked</span>
                        ) : (
                          <span className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => openDate(iso)} className="rounded-full border border-maroon/30 px-2 py-0.5 text-[11px] font-semibold text-maroon hover:bg-maroon/5">
                              Open
                            </button>
                            <button type="button" onClick={() => block(iso)} className="rounded-full border border-red-300 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-50">
                              Block
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <label className="flex items-start gap-2 text-sm text-ink/80">
              <input type="checkbox" name="postNotice" defaultChecked={!seva} className="mt-0.5 h-4 w-4" />
              <span>
                Announce on the notice board
                <span className="block text-xs text-ink/50">Posts “tickets open” with the dates when you save new dates.</span>
              </span>
            </label>
          </div>
        </div>
      </Section>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-3 sm:px-6">
          {state?.error ? <p className="mr-auto text-sm text-red-600">{state.error}</p> : null}
          <Link href="/admin/sevas" className="text-sm font-semibold text-ink/60 hover:text-maroon">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : seva ? "Save changes" : "Create seva"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-black/[0.02] p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-display text-lg text-maroon">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-sm text-cream">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Choice({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-48 flex-1 rounded-xl border px-4 py-3 text-left transition-colors ${
        active ? "border-maroon bg-maroon text-cream" : "border-ink/15 bg-white/70 text-ink hover:border-gold"
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className={`block text-xs ${active ? "text-cream/80" : "text-ink/50"}`}>{hint}</span>
    </button>
  );
}

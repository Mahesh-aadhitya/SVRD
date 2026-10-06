"use client";

import { useState } from "react";
import { isoFromDate, localTodayIso, parseIso } from "@/lib/dates";

export type CalendarProps = {
  /** Selected single date (yyyy-mm-dd). */
  value?: string | null;
  /** Highlighted range (for range pickers). */
  rangeStart?: string | null;
  rangeEnd?: string | null;
  /** Earliest selectable date. Defaults to today unless allowPast. */
  min?: string | null;
  /** Latest selectable date. */
  max?: string | null;
  allowPast?: boolean;
  /** Custom selection (multi-date / weekday patterns). */
  isSelected?: (iso: string) => boolean;
  /** Custom soft highlight (e.g. the span a pattern covers). */
  isInRange?: (iso: string) => boolean;
  /** Extra per-day rule, e.g. fully-booked dates. */
  isDisabled?: (iso: string) => boolean;
  /** Small caption under the day number, e.g. slots left. */
  dayNote?: (iso: string) => React.ReactNode;
  onSelect: (iso: string) => void;
  locale?: string;
};

const WEEK_START = new Date(2024, 0, 7); // a Sunday

// Month-grid calendar used for every date choice in the app. Dates before
// `min` (today by default) or after `max` are rendered but not selectable,
// and month navigation stops at the allowed window.
export default function Calendar({
  value,
  rangeStart,
  rangeEnd,
  min,
  max,
  allowPast,
  isSelected,
  isInRange,
  isDisabled,
  dayNote,
  onSelect,
  locale = "en",
}: CalendarProps) {
  const today = localTodayIso();
  const effectiveMin = min ?? (allowPast ? null : today);
  const intlLocale = locale === "kn" ? "kn-IN" : "en-IN";

  const initial = value ?? rangeStart ?? (effectiveMin && effectiveMin > today ? effectiveMin : today);
  const [view, setView] = useState(() => {
    const d = parseIso(initial);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthKey = (y: number, m: number) => y * 12 + m;
  const minKey = effectiveMin ? monthKey(parseIso(effectiveMin).getFullYear(), parseIso(effectiveMin).getMonth()) : null;
  const maxKey = max ? monthKey(parseIso(max).getFullYear(), parseIso(max).getMonth()) : null;
  const currentKey = monthKey(view.year, view.month);
  const canPrev = minKey === null || currentKey > minKey;
  const canNext = maxKey === null || currentKey < maxKey;

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  const first = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoFromDate(new Date(view.year, view.month, i + 1))),
  ];

  const blocked = (iso: string) =>
    (effectiveMin !== null && iso < effectiveMin) || (!!max && iso > max) || (isDisabled?.(iso) ?? false);

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(WEEK_START);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString(intlLocale, { weekday: "narrow" });
  });

  return (
    <div className="w-full max-w-sm select-none rounded-2xl border border-gold/30 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <NavButton disabled={!canPrev} onClick={() => shift(-1)} label="Previous month" dir="prev" />
        <p className="font-display text-base text-maroon">
          {first.toLocaleDateString(intlLocale, { month: "long", year: "numeric" })}
        </p>
        <NavButton disabled={!canNext} onClick={() => shift(1)} label="Next month" dir="next" />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink/45">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`blank-${i}`} />;
          const disabled = blocked(iso);
          const selected = iso === value || iso === rangeStart || iso === rangeEnd || (isSelected?.(iso) ?? false);
          const inRange =
            (!!rangeStart && !!rangeEnd && iso > rangeStart && iso < rangeEnd) || (isInRange?.(iso) ?? false);
          const note = !disabled ? dayNote?.(iso) : null;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              aria-pressed={selected}
              aria-label={parseIso(iso).toLocaleDateString(intlLocale, { dateStyle: "full" })}
              className={`flex min-h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-maroon font-semibold text-cream"
                  : inRange
                    ? "bg-gold/25 text-maroon-dark"
                    : disabled
                      ? "cursor-not-allowed text-ink/20 line-through decoration-ink/15"
                      : "text-ink hover:bg-gold/15"
              } ${iso === today && !selected ? "ring-1 ring-inset ring-gold" : ""}`}
            >
              <span>{parseIso(iso).getDate()}</span>
              {note ? (
                <span className={`text-[9px] leading-none ${selected ? "text-cream/80" : "text-ink/50"}`}>{note}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavButton({
  disabled,
  onClick,
  label,
  dir,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  dir: "prev" | "next";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-maroon hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-25"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

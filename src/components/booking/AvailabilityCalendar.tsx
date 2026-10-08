"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { isoFromDate, parseIso, stableIntl } from "@/lib/dates";

export type DayStatus = "available" | "filling" | "full" | "closed" | "blocked";

// Inline colours (not utility classes) so the availability colours always
// render, even when a stale stylesheet is cached during development.
export const statusColors: Record<DayStatus, CSSProperties> = {
  available: { backgroundColor: "#dcfce7", borderColor: "#16a34a", color: "#14532d" },
  filling: { backgroundColor: "#fef3c7", borderColor: "#d97706", color: "#78350f" },
  full: { backgroundColor: "#fee2e2", borderColor: "#dc2626", color: "#991b1b" },
  closed: { backgroundColor: "rgba(42,27,18,0.04)", borderColor: "transparent", color: "rgba(42,27,18,0.3)" },
  // Closed by the temple for a reason the devotee can tap to read.
  blocked: { backgroundColor: "#fff1f2", borderColor: "#fda4af", color: "#9f1239", borderStyle: "dashed" },
};

export const selectedColors: CSSProperties = {
  backgroundColor: "var(--color-temple-maroon)",
  borderColor: "var(--color-temple-maroon)",
  color: "var(--color-temple-cream)",
};

const WEEK_START = new Date(2024, 0, 7); // a Sunday

// TTD/IRCTC-style compact month calendar: each date is a small box coloured
// by availability (green open, yellow filling fast, red full, grey closed).
export default function AvailabilityCalendar({
  firstMonth,
  lastMonth,
  selected,
  locale,
  dayStatus,
  onSelect,
  showBlocked = false,
}: {
  /** First/last bookable dates — month navigation stays within them. */
  firstMonth: string;
  lastMonth: string;
  selected: string | null;
  locale: string;
  dayStatus: (iso: string) => DayStatus;
  onSelect: (iso: string) => void;
  /** Include the "closed — tap for reason" key in the legend. */
  showBlocked?: boolean;
}) {
  const t = useTranslations("booking");
  const intl = locale === "kn" ? "kn-IN" : "en-IN";
  const monthIndex = (iso: string) => parseIso(iso).getFullYear() * 12 + parseIso(iso).getMonth();
  const minIndex = monthIndex(firstMonth);
  const maxIndex = monthIndex(lastMonth);
  const [month, setMonth] = useState(minIndex);

  const year = Math.floor(month / 12);
  const first = new Date(year, month % 12, 1);
  const days = new Date(year, (month % 12) + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: days }, (_, d) => isoFromDate(new Date(year, month % 12, d + 1))),
  ];
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(WEEK_START);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString(intl, { weekday: "narrow" });
  });

  return (
    <div style={{ maxWidth: 360 }} className="w-full">
      <div className="flex items-center justify-between">
        <NavButton dir="prev" disabled={month <= minIndex} onClick={() => setMonth((m) => m - 1)} label={t("prevMonth")} />
        <p className="font-display text-base text-maroon">{stableIntl(first.toLocaleDateString(intl, { month: "long", year: "numeric" }))}</p>
        <NavButton dir="next" disabled={month >= maxIndex} onClick={() => setMonth((m) => m + 1)} label={t("nextMonth")} />
      </div>

      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-ink/45" style={{ gap: 4 }}>
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ gap: 4 }}>
        {cells.map((iso, idx) => {
          if (!iso) return <span key={`b${idx}`} />;
          const status = dayStatus(iso);
          const isSelected = iso === selected;
          const clickable = status === "available" || status === "filling" || status === "blocked";
          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              onClick={() => onSelect(iso)}
              aria-pressed={isSelected}
              aria-label={`${stableIntl(parseIso(iso).toLocaleDateString(intl, { dateStyle: "full" }))} — ${t(`legend.${status}`)}`}
              style={{
                height: 40,
                borderWidth: isSelected ? 2 : 1,
                borderStyle: "solid",
                borderRadius: 8,
                ...(isSelected ? selectedColors : statusColors[status]),
                position: "relative",
                cursor: clickable ? "pointer" : "not-allowed",
              }}
              className="flex items-center justify-center text-sm font-semibold"
            >
              {parseIso(iso).getDate()}
              {status === "blocked" ? (
                <span aria-hidden style={{ position: "absolute", top: 2, right: 4, fontSize: 9, lineHeight: 1 }}>
                  ⓘ
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Legend showBlocked={showBlocked} />
    </div>
  );
}

function Legend({ showBlocked }: { showBlocked: boolean }) {
  const t = useTranslations("booking.legend");
  const statuses: DayStatus[] = ["available", "filling", "full", "closed", ...(showBlocked ? (["blocked"] as const) : [])];
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink/70">
      {statuses.map((status) => (
        <span key={status} className="inline-flex items-center gap-1.5">
          <span
            style={{ borderStyle: "solid", ...statusColors[status], width: 12, height: 12, borderRadius: 3, borderWidth: 1, display: "inline-block" }}
          />
          {t(status)}
        </span>
      ))}
    </div>
  );
}

function NavButton({ dir, disabled, onClick, label }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-gold/40 bg-white/70 text-sm font-semibold text-maroon hover:border-maroon/50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {dir === "prev" ? "←" : "→"}
    </button>
  );
}

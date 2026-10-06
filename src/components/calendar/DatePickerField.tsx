"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Calendar from "@/components/calendar/Calendar";
import { usePopover } from "@/components/calendar/usePopover";
import { formatIso } from "@/lib/dates";

// Form field: a button showing the chosen date that opens the Calendar in a
// popover, plus a hidden input carrying yyyy-mm-dd for the Server Action.
export default function DatePickerField({
  name,
  label,
  defaultValue,
  min,
  max,
  allowPast,
  required,
  clearable,
  placeholder = "Select a date",
  align = "left",
  compact,
  onChange,
}: {
  name: string;
  label?: string;
  defaultValue?: string | null;
  min?: string | null;
  max?: string | null;
  allowPast?: boolean;
  required?: boolean;
  clearable?: boolean;
  placeholder?: string;
  align?: "left" | "right";
  compact?: boolean;
  onChange?: (iso: string) => void;
}) {
  const locale = useLocale();
  const [value, setValue] = useState(defaultValue ?? "");
  const { open, setOpen, ref } = usePopover();

  return (
    <div ref={ref} className="relative">
      {label ? <p className="text-sm font-medium text-ink/70">{label}</p> : null}
      {/* Hidden inputs can't be `required`; a visually-hidden text input can. */}
      <input
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
        onFocus={() => setOpen(true)}
      />
      <div className={`flex items-center gap-2 ${label ? "mt-1.5" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`flex items-center gap-2 rounded-xl border border-ink/15 bg-black/[0.03] text-left text-ink outline-none hover:border-gold focus:border-gold ${
            compact ? "px-2.5 py-1.5 text-xs" : "w-full px-4 py-2.5 text-sm"
          }`}
        >
          <CalendarGlyph />
          <span className={value ? "" : "text-ink/40"}>
            {value ? formatIso(value, locale, { day: "numeric", month: "short", year: "numeric" }) : placeholder}
          </span>
        </button>
        {clearable && value ? (
          <button type="button" onClick={() => setValue("")} className="text-xs font-semibold text-ink/50 hover:text-maroon">
            Clear
          </button>
        ) : null}
      </div>
      {open ? (
        <div
          role="dialog"
          className={`absolute z-50 mt-2 w-[19rem] ${align === "right" ? "right-0" : "left-0"}`}
        >
          <Calendar
            value={value || null}
            min={min}
            max={max}
            allowPast={allowPast}
            locale={locale}
            onSelect={(iso) => {
              setValue(iso);
              onChange?.(iso);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-maroon" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

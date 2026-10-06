"use client";

import { useTranslations } from "next-intl";
import { NAKSHATRAS } from "@/lib/nakshatras";

export type DevoteeDraft = { name: string; gotram: string; nakshatram: string };

export const emptyDevotee: DevoteeDraft = {
  name: "",
  gotram: "",
  nakshatram: "",
};

// Fixed height so text inputs and the nakshatram select line up (Safari
// otherwise draws selects shorter than inputs).
export const fieldClass =
  "mt-1 block h-11 w-full rounded-xl border border-gold/30 bg-white px-3 text-sm text-ink outline-none focus:border-maroon";

// One card per ticket: name (required), gotram and nakshatram (optional).
// With "same gotram for everyone" on, only the first card asks for it —
// families usually share one gotram.
export default function DevoteeFields({
  devotees,
  count,
  sameGotram,
  locale,
  wide = false,
  onChange,
  onSameGotramChange,
}: {
  devotees: DevoteeDraft[];
  count: number;
  sameGotram: boolean;
  locale: string;
  /** Lay the cards out two-up when there's room (details under the calendar). */
  wide?: boolean;
  onChange: (index: number, patch: Partial<DevoteeDraft>) => void;
  onSameGotramChange: (same: boolean) => void;
}) {
  const t = useTranslations("booking.devotee");

  return (
    <div className="space-y-3">
      {count > 1 ? (
        <label className="flex items-center gap-2 text-xs text-ink/70">
          <input
            type="checkbox"
            checked={sameGotram}
            onChange={(e) => onSameGotramChange(e.target.checked)}
            className="h-4 w-4"
          />
          {t("sameGotram")}
        </label>
      ) : null}

      <div className={wide && count > 1 ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
        {devotees.slice(0, count).map((devotee, i) => {
          const showGotram = i === 0 || !sameGotram;
          return (
            <fieldset
              key={i}
              className="min-w-0 rounded-xl border border-gold/25 bg-cream/40 px-4 pb-4 pt-2"
            >
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-maroon">
                {count > 1 ? t("numbered", { number: i + 1 }) : t("single")}
              </legend>

              <label
                className="block text-sm font-medium text-ink/70"
                htmlFor={`devotee-${i}-name`}
              >
                {t("name")}
              </label>
              <input
                id={`devotee-${i}-name`}
                required
                minLength={2}
                maxLength={100}
                autoComplete={i === 0 ? "name" : "off"}
                value={devotee.name}
                onChange={(e) => onChange(i, { name: e.target.value })}
                className={fieldClass}
              />

              <div
                className={`mt-3 grid gap-3 ${showGotram ? "sm:grid-cols-2" : ""}`}
              >
                {showGotram ? (
                  <div>
                    <label
                      className="block text-sm font-medium text-ink/70"
                      htmlFor={`devotee-${i}-gotram`}
                    >
                      {t("gotram")}{" "}
                      <span className="font-normal text-ink/40">
                        ({t("optional")})
                      </span>
                    </label>
                    <input
                      id={`devotee-${i}-gotram`}
                      maxLength={60}
                      value={devotee.gotram}
                      onChange={(e) => onChange(i, { gotram: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                ) : null}
                <div>
                  <label
                    className="block text-sm font-medium text-ink/70"
                    htmlFor={`devotee-${i}-nakshatram`}
                  >
                    {t("nakshatram")}{" "}
                    <span className="font-normal text-ink/40">
                      ({t("optional")})
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id={`devotee-${i}-nakshatram`}
                      value={devotee.nakshatram}
                      onChange={(e) =>
                        onChange(i, { nakshatram: e.target.value })
                      }
                      className={`${fieldClass} appearance-none pr-9`}
                    >
                      <option value="">—</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n.key} value={n.key}>
                          {locale === "kn" ? `${n.kn} (${n.key})` : n.key}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden
                      viewBox="0 0 20 20"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

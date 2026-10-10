"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import DatePickerField from "@/components/calendar/DatePickerField";
import DevoteeFields, { emptyDevotee, fieldClass, type DevoteeDraft } from "@/components/booking/DevoteeFields";
import { createSevaRequest } from "@/lib/actions/seva-requests";
import { REQUEST_OCCASIONS, type RequestOccasion } from "@/lib/seva-requests/types";

type Choice = { id: string; name: { en: string; kn: string }; onRequest: boolean };
const OTHER = "__other";
const MAX_DEVOTEES = 10;

// The "seva on your special day" request: which seva (or one described in
// the devotee's own words), the day, the occasion, the devotees for the
// sankalpa and a number to call back on.
export default function SevaRequestForm({
  sevas,
  initialSevaId,
  defaultName,
  defaultGotram,
  defaultNakshatram,
  defaultPhone,
}: {
  sevas: Choice[];
  initialSevaId: string | null;
  defaultName: string;
  defaultGotram: string;
  defaultNakshatram: string;
  defaultPhone: string;
}) {
  const t = useTranslations("sevaRequest");
  const locale = useLocale();
  const [sevaId, setSevaId] = useState(initialSevaId ?? sevas[0]?.id ?? OTHER);
  const [otherSeva, setOtherSeva] = useState("");
  const [date, setDate] = useState("");
  const [occasion, setOccasion] = useState<RequestOccasion | "">("");
  const [devotees, setDevotees] = useState<DevoteeDraft[]>([{ name: defaultName, gotram: defaultGotram, nakshatram: defaultNakshatram }]);
  const [sameGotram, setSameGotram] = useState(true);
  const [phone, setPhone] = useState(defaultPhone);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string; phone: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const name = (c: Choice) => (locale === "kn" ? c.name.kn || c.name.en : c.name.en);
  const label = "block text-sm font-medium text-ink/70";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const shared = sameGotram && devotees.length > 1 ? devotees[0].gotram : null;
    startTransition(async () => {
      const r = await createSevaRequest(locale, {
        sevaId: sevaId === OTHER ? null : sevaId,
        otherSeva: sevaId === OTHER ? otherSeva : "",
        date,
        occasion,
        devotees: devotees.map((d) => ({ name: d.name, gotram: shared ?? d.gotram, nakshatram: d.nakshatram })),
        phone,
        note,
      });
      if (r.ok) {
        setDone({ reference: r.reference, phone: r.phone });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(t(`errors.${r.error}`));
    });
  }

  if (done) {
    return (
      <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-gold/30 bg-white/85 p-8 text-center shadow-sm">
        <p className="font-display text-2xl text-maroon">{t("doneTitle")}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">{t("doneBody", { phone: done.phone, ref: done.reference })}</p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setDate("");
            setNote("");
          }}
          className="mt-6 text-sm font-semibold text-maroon hover:underline"
        >
          {t("another")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border border-gold/25 bg-white/75 p-5 shadow-sm sm:p-7">
      <div>
        <label className={label} htmlFor="req-seva">
          {t("sevaLabel")}
        </label>
        <select id="req-seva" value={sevaId} onChange={(e) => setSevaId(e.target.value)} className={`${fieldClass} appearance-none`}>
          {sevas.map((c) => (
            <option key={c.id} value={c.id}>
              {name(c)}
            </option>
          ))}
          <option value={OTHER}>{t("otherSeva")}</option>
        </select>
        {sevaId === OTHER ? (
          <div className="mt-3">
            <label className={label} htmlFor="req-other">
              {t("otherSevaLabel")}
            </label>
            <input id="req-other" required maxLength={200} value={otherSeva} onChange={(e) => setOtherSeva(e.target.value)} className={fieldClass} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className={label}>{t("dateLabel")}</p>
          <div className="mt-1">
            <DatePickerField name="date" required placeholder={t("pickDate")} defaultValue={date || null} onChange={setDate} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="req-phone">
            {t("phoneLabel")}
          </label>
          <input
            id="req-phone"
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98xxxxxxxx"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <p className={label}>{t("occasionLabel")}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {REQUEST_OCCASIONS.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={occasion === o}
              onClick={() => setOccasion(occasion === o ? "" : o)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                occasion === o ? "border-maroon bg-maroon text-cream" : "border-gold/40 bg-white text-ink/75 hover:border-maroon/40"
              }`}
            >
              {t(`occasions.${o}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`${label} mb-2`}>{t("devoteesLabel")}</p>
        <DevoteeFields
          devotees={devotees}
          count={devotees.length}
          sameGotram={sameGotram}
          locale={locale}
          wide
          onChange={(i, patch) => setDevotees((all) => all.map((d, j) => (j === i ? { ...d, ...patch } : d)))}
          onSameGotramChange={setSameGotram}
        />
        <div className="mt-2 flex gap-4 text-sm font-semibold">
          {devotees.length < MAX_DEVOTEES ? (
            <button type="button" onClick={() => setDevotees((all) => [...all, { ...emptyDevotee }])} className="text-maroon hover:underline">
              {t("addDevotee")}
            </button>
          ) : null}
          {devotees.length > 1 ? (
            <button type="button" onClick={() => setDevotees((all) => all.slice(0, -1))} className="text-ink/50 hover:text-red-700 hover:underline">
              {t("removeDevotee")}
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="req-note">
          {t("noteLabel")}
        </label>
        <textarea
          id="req-note"
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-gold/30 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-maroon"
        />
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !date}
        className="h-12 w-full rounded-full bg-maroon text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

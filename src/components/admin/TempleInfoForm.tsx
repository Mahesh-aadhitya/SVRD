"use client";

import { useActionState, useState, useTransition } from "react";
import { locateTemple, updateTempleInfo } from "@/lib/actions/temple-info";
import type { TempleInfo, TempleTiming } from "@/lib/content-types";
import { DAY_PRESETS, formatClockTime } from "@/lib/temple-timings";
import BilingualField from "@/components/admin/BilingualField";
import { mapEmbedSrc } from "@/lib/temple-map";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";
const small =
  "rounded-lg border border-ink/15 bg-black/[0.03] px-2.5 py-1.5 text-sm text-ink outline-none focus:border-gold";

type Row = { day: string; dayKn: string; sessions: { open: string; close: string }[] };

// Older rows stored only "5:30 AM – 9:00 PM" text: read sessions back out of it.
function toRow(t: TempleTiming): Row {
  if (t.sessions?.length) return { day: t.day, dayKn: t.dayKn ?? "", sessions: t.sessions };
  const to24 = (s: string) => {
    const m = s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return "";
    let h = Number(m[1]) % 12;
    if (m[3]?.toUpperCase() === "PM") h += 12;
    if (!m[3] && Number(m[1]) === 12) h = 12;
    return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
  };
  const sessions = t.hours
    .split(",")
    .map((part) => part.split(/[–-]/))
    .map(([a, b]) => ({ open: to24(a ?? ""), close: to24(b ?? "") }))
    .filter((s) => s.open && s.close);
  return { day: t.day, dayKn: t.dayKn ?? DAY_PRESETS.find((p) => p.en === t.day)?.kn ?? "", sessions: sessions.length ? sessions : [{ open: "06:00", close: "12:00" }] };
}

// "Kolar , Karnataka,563101" → "Shri … Devasthana, Kolar, Karnataka 563101"
function withTown(name: string, addressLine2: string) {
  const town = addressLine2
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ")
    .replace(/,\s*(\d{6})$/, " $1");
  return town ? `${name}, ${town}` : name;
}

export default function TempleInfoForm({ info }: { info: TempleInfo }) {
  const [state, formAction, pending] = useActionState(updateTempleInfo, undefined);
  const [rows, setRows] = useState<Row[]>(() =>
    info.timings.length
      ? info.timings.map(toRow)
      : [{ day: "Daily", dayKn: "ಪ್ರತಿದಿನ", sessions: [{ open: "06:00", close: "12:00" }, { open: "17:00", close: "20:30" }] }],
  );
  const [mapsInput, setMapsInput] = useState(info.mapsUrl || (info.lat == null ? info.mapsQuery : ""));
  const [place, setPlace] = useState(info.mapsPlace);
  const [lat, setLat] = useState(info.lat != null ? String(info.lat) : "");
  const [lon, setLon] = useState(info.lon != null ? String(info.lon) : "");
  const [mapNote, setMapNote] = useState<string | null>(null);
  const [locating, startLocating] = useTransition();

  function findPin() {
    setMapNote(null);
    startLocating(async () => {
      const found = await locateTemple(mapsInput);
      if (!found) {
        setMapNote("Couldn't read the pin from that. In Google Maps tap the temple's red pin so its name shows, then Share → Copy link and paste it — or type the coordinates.");
        return;
      }
      setLat(found.lat.toFixed(6));
      setLon(found.lon.toFixed(6));
      // A bare name would match every temple of that name: add the town.
      if (found.label) setPlace(found.label.includes(",") ? found.label : withTown(found.label, info.addressLine2));
      setMapNote(found.label ? `Found: ${found.label}` : "Found — check the pin below.");
    });
  }

  const update = (i: number, patch: Partial<Row>) => setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const hasPin = lat !== "" && lon !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address line 1" name="addressLine1" defaultValue={info.addressLine1} />
        <Field label="Address line 2 (city, state, PIN)" name="addressLine2" defaultValue={info.addressLine2} />
        <Field label="Phone" name="phone" defaultValue={info.phone} type="tel" />
        <Field label="Email" name="email" defaultValue={info.email} type="email" />
      </div>

      {/* Map */}
      <section className="rounded-2xl border border-ink/10 p-4">
        <p className="text-sm font-semibold text-ink/80">Location on the map</p>
        <p className="mt-0.5 text-xs text-ink/50">
          In Google Maps open the temple, tap <b>Share → Copy link</b> and paste it here. A full address or &ldquo;13.1229, 78.1484&rdquo; also works.
          The pin is used for the map, &ldquo;Get directions&rdquo; and the Panchangam&rsquo;s sunrise times.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            name="mapsInput"
            value={mapsInput}
            onChange={(e) => {
              setMapsInput(e.target.value);
              setLat("");
              setLon("");
              setPlace("");
              setMapNote(null);
            }}
            placeholder="https://maps.app.goo.gl/…"
            className={`${inputClass} mt-0 min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={findPin}
            disabled={!mapsInput.trim() || locating}
            className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50"
          >
            {locating ? "Finding…" : "Find on map"}
          </button>
        </div>
        {mapNote ? <p className="mt-1.5 text-xs text-ink/60">{mapNote}</p> : null}
        <label className="mt-3 block text-xs text-ink/60">
          Name and address as on Google Maps — shows the temple&rsquo;s own listing, not every temple with this name
          <input
            name="mapsPlace"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Shri Varadaraja Swamy Devasthana, Ammavaripet Rd, Kolar, Karnataka 563101"
            className={inputClass}
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ink/60">
            Latitude
            <input name="lat" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="13.122902" className={inputClass} />
          </label>
          <label className="text-xs text-ink/60">
            Longitude
            <input name="lon" value={lon} onChange={(e) => setLon(e.target.value)} inputMode="decimal" placeholder="78.148403" className={inputClass} />
          </label>
        </div>
        {hasPin ? (
          <iframe
            title="Map preview"
            className="mt-3 h-64 w-full rounded-xl border border-ink/10"
            loading="lazy"
            src={mapEmbedSrc(place, lat, lon)}
          />
        ) : null}
      </section>

      {/* Timings */}
      <section className="rounded-2xl border border-ink/10 p-4">
        <p className="text-sm font-semibold text-ink/80">Temple timings</p>
        <p className="mt-0.5 text-xs text-ink/50">Add a row for each set of days, with the times the temple is open (add a second time for the evening).</p>
        <input type="hidden" name="timings" value={JSON.stringify(rows)} />
        <div className="mt-3 space-y-3">
          {rows.map((row, i) => {
            const preset = DAY_PRESETS.find((p) => p.en === row.day);
            return (
              <div key={i} className="rounded-xl bg-black/[0.02] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={preset ? row.day : "__custom"}
                    onChange={(e) => {
                      const p = DAY_PRESETS.find((x) => x.en === e.target.value);
                      update(i, p ? { day: p.en, dayKn: p.kn } : { day: "", dayKn: "" });
                    }}
                    className={small}
                  >
                    {DAY_PRESETS.map((p) => (
                      <option key={p.en} value={p.en}>
                        {p.en} · {p.kn}
                      </option>
                    ))}
                    <option value="__custom">Other…</option>
                  </select>
                  {!preset ? (
                    <>
                      <input value={row.day} onChange={(e) => update(i, { day: e.target.value })} placeholder="Days (English)" className={small} />
                      <input value={row.dayKn} onChange={(e) => update(i, { dayKn: e.target.value })} placeholder="ದಿನಗಳು (ಕನ್ನಡ)" className={small} />
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setRows((list) => list.filter((_, j) => j !== i))}
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {row.sessions.map((s, k) => (
                    <div key={k} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="w-14 text-xs text-ink/50">{k === 0 ? "Open" : "Then"}</span>
                      <input
                        type="time"
                        value={s.open}
                        onChange={(e) => update(i, { sessions: row.sessions.map((x, j) => (j === k ? { ...x, open: e.target.value } : x)) })}
                        className={small}
                      />
                      <span className="text-ink/40">to</span>
                      <input
                        type="time"
                        value={s.close}
                        onChange={(e) => update(i, { sessions: row.sessions.map((x, j) => (j === k ? { ...x, close: e.target.value } : x)) })}
                        className={small}
                      />
                      <span className="text-xs text-ink/45">
                        {s.open && s.close ? `${formatClockTime(s.open, "en")} – ${formatClockTime(s.close, "en")}` : ""}
                      </span>
                      {row.sessions.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => update(i, { sessions: row.sessions.filter((_, j) => j !== k) })}
                          className="text-xs text-ink/45 hover:text-red-600"
                          aria-label="Remove time"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {row.sessions.length < 4 ? (
                    <button
                      type="button"
                      onClick={() => update(i, { sessions: [...row.sessions, { open: "17:00", close: "20:30" }] })}
                      className="text-xs font-semibold text-maroon hover:underline"
                    >
                      + Add another time
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setRows((list) => [...list, { day: "Festival days", dayKn: "ಹಬ್ಬದ ದಿನಗಳು", sessions: [{ open: "05:00", close: "21:00" }] }])}
          className="mt-3 rounded-full border border-gold/50 px-4 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/15"
        >
          + Add days
        </button>
      </section>

      <BilingualField
        label="About the temple"
        enName="aboutEn"
        knName="aboutKn"
        defaultEn={info.about.en}
        defaultKn={info.about.kn}
        multiline
        rows={6}
        maxLength={5000}
      />

      {state?.error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="rounded-xl bg-gold/15 px-3 py-2 text-xs text-maroon">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-ink/70" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className={inputClass} />
    </div>
  );
}

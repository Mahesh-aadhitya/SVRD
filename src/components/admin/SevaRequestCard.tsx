"use client";

import { useState, useTransition } from "react";
import { updateSevaRequest } from "@/lib/actions/seva-requests";
import { nakshatraLabel } from "@/lib/nakshatras";
import { REQUEST_STATUSES, type RequestStatus, type SevaRequest } from "@/lib/seva-requests/types";

const STATUS: Record<RequestStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "bg-red-100 text-red-800" },
  contacted: { label: "Called", tone: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", tone: "bg-green-100 text-green-800" },
  done: { label: "Done", tone: "bg-black/5 text-ink/60" },
  declined: { label: "Declined", tone: "bg-black/5 text-ink/50" },
};
const OCCASION: Record<string, string> = {
  birthday: "Birthday",
  anniversary: "Wedding anniversary",
  remembrance: "Remembrance (tithi)",
  beginning: "New beginning",
  other: "Other",
};

const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// One request: when and what, who for, how to reach them, and where the
// office is with it (status + a private note).
export default function SevaRequestCard({ request: r }: { request: SevaRequest }) {
  const [status, setStatus] = useState(r.status);
  const [note, setNote] = useState(r.officeNote);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (patch: { status?: RequestStatus; officeNote?: string }) =>
    start(async () => {
      try {
        await updateSevaRequest(r.id, patch);
        setSaved("Saved");
      } catch {
        setSaved("Couldn't save");
      }
    });

  return (
    <article className="rounded-2xl border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">{day(r.requestedDate)}</p>
          <p className="font-display text-xl text-maroon">{r.sevaName}</p>
          <p className="text-xs text-ink/55">
            {r.occasion ? `${OCCASION[r.occasion] ?? r.occasion} · ` : ""}Ref {r.reference} · asked{" "}
            {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[status].tone}`}>{STATUS[status].label}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:+91${r.phone}`} className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark">
          📞 Call {r.phone}
        </a>
        <a
          href={`https://wa.me/91${r.phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-green-600/40 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
        >
          WhatsApp
        </a>
        {r.email ? (
          <a href={`mailto:${r.email}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-black/[0.03]">
            {r.email}
          </a>
        ) : null}
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-ink/45">
          <tr>
            <th className="py-1 pr-3 font-medium">Devotee</th>
            <th className="py-1 pr-3 font-medium">Gotram</th>
            <th className="py-1 font-medium">Nakshatram</th>
          </tr>
        </thead>
        <tbody>
          {r.devotees.map((d, i) => (
            <tr key={i} className="border-t border-ink/10">
              <td className="py-1.5 pr-3 font-medium text-ink">{d.name}</td>
              <td className="py-1.5 pr-3 text-ink/70">{d.gotram || "—"}</td>
              <td className="py-1.5 text-ink/70">{d.nakshatram ? `${d.nakshatram} · ${nakshatraLabel(d.nakshatram, "kn")}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {r.note ? <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-sm italic text-ink/70">“{r.note}”</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
        {REQUEST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => {
              setStatus(s);
              save({ status: s });
            }}
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              status === s ? "border-maroon bg-maroon text-cream" : "border-ink/15 text-ink/65 hover:border-maroon/40"
            }`}
          >
            {STATUS[s].label}
          </button>
        ))}
        <input
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== r.officeNote && save({ officeNote: note })}
          placeholder="Office note (e.g. confirmed ₹500, 7 AM)"
          className="min-w-48 flex-1 rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm outline-none focus:border-gold"
        />
        {saved ? <span className="text-xs text-ink/50">{pending ? "Saving…" : saved}</span> : null}
      </div>
    </article>
  );
}

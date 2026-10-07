"use client";

import { useState } from "react";
import type { PaymentAttempt } from "@/lib/data/bookings";

const REASONS: Record<string, string> = {
  not_payment: "Not a UPI payment screenshot",
  not_successful: "Payment not successful (failed / pending)",
  wrong_receiver: "Not paid to the temple's UPI account",
  amount_mismatch: "Amount doesn't match the tickets",
  missing_time: "No payment date / time visible",
  date_mismatch: "Paid on a different day than the QR was shown",
  time_mismatch: "Paid outside the 10-minute QR window",
  other_booking: "Payment note names another booking",
  utr_mismatch: "Typed UTR differs from the screenshot",
  missing_utr: "No transaction ID (UTR)",
  duplicate_utr: "UTR already used for another booking",
};

const stamp = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

// Screenshots the automatic check refused, with what was read from each.
export default function RejectedAttempts({ attempts }: { attempts: PaymentAttempt[] }) {
  const [zoom, setZoom] = useState<string | null>(null);
  if (!attempts.length) {
    return <p className="rounded-2xl bg-black/[0.03] px-5 py-8 text-center text-sm text-ink/55">No rejected screenshots.</p>;
  }
  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {attempts.map((a) => {
          const r = a.reading ?? {};
          const read = [
            r.amount != null ? `₹${r.amount}` : null,
            r.date || r.time ? `${r.date ?? "?"} ${r.time ?? ""}`.trim() : null,
            r.payeeName ? `to ${r.payeeName}` : null,
            r.payeeUpiId ? String(r.payeeUpiId) : null,
            r.utr ? `UTR ${r.utr}` : null,
            r.status ? String(r.status) : null,
          ].filter(Boolean);
          return (
            <li key={a.id} className="flex gap-3 rounded-2xl border border-red-600/20 bg-white/80 p-3 sm:p-4">
              <button
                type="button"
                onClick={() => a.proofUrl && setZoom(a.proofUrl)}
                className="h-32 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-black/[0.04]"
                aria-label="View screenshot"
              >
                {a.proofUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed private URL
                  <img src={a.proofUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </button>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-red-700">✕ {REASONS[a.reason ?? ""] ?? a.reason}</p>
                <p className="mt-1">
                  <span className="font-mono font-bold tracking-widest text-maroon">{a.reference}</span> · ₹{a.amount} expected
                </p>
                <p className="text-xs text-ink/60">
                  {a.devoteeName} ·{" "}
                  <a href={`tel:${a.phone}`} className="hover:underline">
                    {a.phone}
                  </a>
                </p>
                {read.length ? <p className="mt-1 text-xs text-ink/55">Read: {read.join(" · ")}</p> : null}
                <p className="text-xs text-ink/45">Uploaded {stamp(a.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {zoom ? (
        <div role="dialog" aria-modal aria-label="Screenshot" onClick={() => setZoom(null)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed private URL */}
          <img src={zoom} alt="Screenshot" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { rejectPayment, setPaymentUtr, verifyPayment } from "@/lib/actions/payments";
import type { PaymentLogEntry } from "@/lib/data/bookings";
import { formatSlot } from "@/lib/seva-types";
import { formatIso } from "@/lib/dates";
import { useRouter } from "@/i18n/navigation";

const stamp = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

// One card per uploaded UPI screenshot: tap the thumbnail to see it full
// size, then verify or reject. Cards (not a table) so it works one-handed
// on the office phone.
export default function PaymentLog({ entries }: { entries: PaymentLogEntry[] }) {
  const [zoom, setZoom] = useState<string | null>(null);

  if (!entries.length) {
    return <p className="rounded-2xl bg-black/[0.03] px-5 py-8 text-center text-sm text-ink/55">No payment screenshots here.</p>;
  }

  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {entries.map((entry) => (
          <PaymentCard key={entry.id} entry={entry} onZoom={setZoom} />
        ))}
      </ul>

      {zoom ? (
        <div
          role="dialog"
          aria-modal
          aria-label="Payment screenshot"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed private URL */}
          <img src={zoom} alt="Payment screenshot" className="max-h-full max-w-full rounded-lg object-contain" />
          <button type="button" className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/90 text-lg font-bold text-ink" aria-label="Close">
            ✕
          </button>
        </div>
      ) : null}
    </>
  );
}

function PaymentCard({ entry, onZoom }: { entry: PaymentLogEntry; onZoom: (url: string) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [utr, setUtr] = useState(entry.paymentUtr ?? "");
  const [utrMessage, setUtrMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        alert("Couldn't save. Check the connection and try again.");
      }
    });

  const status =
    entry.paymentStatus === "submitted"
      ? { label: "To verify", cls: "bg-amber-500/15 text-amber-800" }
      : entry.paymentStatus === "paid"
        ? { label: "Verified", cls: "bg-green-600/15 text-green-700" }
        : entry.paymentStatus === "refunded"
          ? { label: "Refunded", cls: "bg-blue-600/10 text-blue-700" }
          : { label: "Rejected", cls: "bg-red-500/15 text-red-700" };

  return (
    <li className="flex gap-3 rounded-2xl border border-ink/10 bg-white/80 p-3 sm:gap-4 sm:p-4">
      <button
        type="button"
        onClick={() => entry.proofUrl && onZoom(entry.proofUrl)}
        className="h-36 w-24 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-black/[0.04]"
        aria-label="View screenshot"
      >
        {entry.proofUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed private URL
          <img src={entry.proofUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-ink/40">No image</span>
        )}
      </button>

      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-bold tracking-widest text-maroon">{entry.reference}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
          {entry.status === "cancelled" ? <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-700">Booking cancelled</span> : null}
        </div>
        <p className="mt-1 font-semibold text-ink">
          ₹{entry.amount} · {entry.sevaName.en}
        </p>
        <p className="text-xs text-ink/60">
          {formatIso(entry.date, "en", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          {entry.slot ? ` · ${formatSlot(entry.slot, "en")}` : ""} · {entry.quantity} ticket{entry.quantity > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-ink/60">
          {entry.devoteeName} ·{" "}
          <a href={`tel:${entry.phone}`} className="underline-offset-2 hover:underline">
            {entry.phone}
          </a>
        </p>
        {entry.paymentSubmittedAt ? <p className="text-xs text-ink/45">Paid at {stamp(entry.paymentSubmittedAt)} (from screenshot)</p> : null}
        {entry.paymentNote ? <p className="mt-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-900">{entry.paymentNote}</p> : null}

        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const r = await setPaymentUtr(entry.id, utr);
              setUtrMessage(r.error ?? "Saved");
            });
          }}
        >
          <input
            value={utr}
            onChange={(e) => {
              setUtr(e.target.value);
              setUtrMessage(null);
            }}
            placeholder="UTR / transaction ID"
            aria-label="UTR"
            className="h-9 min-w-0 flex-1 rounded-lg border border-ink/15 bg-white px-2 font-mono text-xs outline-none focus:border-gold"
          />
          {utr !== (entry.paymentUtr ?? "") ? (
            <button disabled={pending} className="h-9 shrink-0 rounded-lg border border-ink/15 px-3 text-xs font-semibold text-ink/70 hover:bg-black/[0.04]">
              Save
            </button>
          ) : null}
        </form>
        {utrMessage ? <p className="mt-1 text-[11px] text-ink/55">{utrMessage}</p> : null}

        {entry.paymentStatus === "submitted" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => verifyPayment(entry.id))}
              className="h-10 rounded-full bg-green-700 px-4 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              ✓ Received — verify
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const note = prompt("Why is this payment rejected? (the devotee sees this on their ticket)", "Payment not received.");
                if (note !== null) run(() => rejectPayment(entry.id, note));
              }}
              className="h-10 rounded-full border border-red-600/40 px-4 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              ✕ Reject
            </button>
          </div>
        ) : entry.paymentReviewedAt ? (
          <p className="mt-2 text-xs text-ink/45">Reviewed {stamp(entry.paymentReviewedAt)}</p>
        ) : null}
      </div>
    </li>
  );
}

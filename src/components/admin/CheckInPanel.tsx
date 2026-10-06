"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import ChakraLoader from "@/components/ChakraLoader";
import { checkInBooking, claimPrasadam, collectPaymentHoldDarshan, type CheckInResult } from "@/lib/actions/bookings";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

type View =
  | { kind: "verifying" }
  | { kind: "darshan_done"; at: string; justNow: boolean }
  | { kind: "prasadam_given"; darshanAt: string; at: string; justNow: boolean }
  | { kind: "held" }
  | { kind: "unpaid" }
  | { kind: "wrong_date" }
  | { kind: "blocked"; title: string; body: string };

function viewFromCheckIn(r: CheckInResult): View {
  if (r.ok) return { kind: "darshan_done", at: r.checkedInAt, justNow: true };
  switch (r.error) {
    case "already_used":
      return r.prasadamClaimedAt
        ? { kind: "prasadam_given", darshanAt: r.checkedInAt ?? "", at: r.prasadamClaimedAt, justNow: false }
        : { kind: "darshan_done", at: r.checkedInAt ?? "", justNow: false };
    case "unpaid":
      return { kind: "unpaid" };
    case "wrong_date":
      return { kind: "wrong_date" };
    case "cancelled":
      return { kind: "blocked", title: "Booking cancelled", body: "This ticket was cancelled and is not valid." };
    case "refunded":
      return { kind: "blocked", title: "Payment refunded", body: "This booking was refunded and is not valid." };
    case "not_found":
      return { kind: "blocked", title: "Invalid ticket", body: "No booking matches this QR." };
  }
}

// One QR, two uses: the first scan of a valid ticket checks it in for
// darshan straight away (no extra tap); later scans offer prasadam, the
// same day or any day after. Tickets that need a decision (unpaid, wrong
// day) wait for the admin.
export default function CheckInPanel({
  reference,
  amount,
  initialCheckedInAt,
  initialPrasadamClaimedAt,
}: {
  reference: string;
  amount: number;
  initialCheckedInAt: string | null;
  initialPrasadamClaimedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>(
    initialPrasadamClaimedAt && initialCheckedInAt
      ? { kind: "prasadam_given", darshanAt: initialCheckedInAt, at: initialPrasadamClaimedAt, justNow: false }
      : initialCheckedInAt
        ? { kind: "darshan_done", at: initialCheckedInAt, justNow: false }
        : { kind: "verifying" },
  );
  // Choices made so far on this scan (payment collected, other day OK), so
  // an unpaid ticket for another day doesn't bounce between the two prompts.
  const opts = useRef<{ collectPayment?: boolean; anyDate?: boolean }>({});
  const started = useRef(false);

  function act(fn: () => Promise<View | null>) {
    startTransition(async () => {
      try {
        const next = await fn();
        if (next) setView(next);
        router.refresh();
      } catch {
        alert("Couldn't reach the server. Check the connection and try again.");
      }
    });
  }

  const checkIn = (more: { collectPayment?: boolean; anyDate?: boolean } = {}) => {
    opts.current = { ...opts.current, ...more };
    act(async () => viewFromCheckIn(await checkInBooking(reference, opts.current)));
  };

  useEffect(() => {
    if (started.current || initialCheckedInAt) return;
    started.current = true;
    checkIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (view.kind) {
    case "verifying":
      return (
        <div className="rounded-2xl border-2 border-ink/15 bg-black/[0.02] p-6 text-center">
          <ChakraLoader label="Verifying ticket…" />
        </div>
      );

    case "darshan_done":
      return (
        <Banner
          tone={view.justNow ? "green" : "blue"}
          icon={view.justNow ? "✓" : "🙏"}
          title={view.justNow ? "Darshan done" : "Darshan already done"}
        >
          {view.justNow ? "Checked in" : "Darshan was done"} {view.at ? `on ${formatTime(view.at)}` : ""}.{" "}
          {view.justNow ? "" : "Do not admit for darshan again. "}
          Prasadam is pending: hand it over now, or the devotee can bring this same QR later.
          <ActionButton
            disabled={pending}
            onClick={() =>
              act(async () => {
                const r = await claimPrasadam(reference);
                if (r.ok) return { kind: "prasadam_given", darshanAt: view.at, at: r.prasadamClaimedAt, justNow: true };
                if (r.error === "already_claimed")
                  return { kind: "prasadam_given", darshanAt: view.at, at: r.prasadamClaimedAt ?? "", justNow: false };
                return { kind: "blocked", title: "Can't give prasadam", body: "Darshan isn't recorded for this ticket." };
              })
            }
          >
            {pending ? "Saving…" : "Give prasadam"}
          </ActionButton>
        </Banner>
      );

    case "prasadam_given":
      return view.justNow ? (
        <Banner tone="green" icon="✓" title="Prasadam given">
          Darshan and prasadam are both done. This QR is now fully used.
        </Banner>
      ) : (
        <Banner tone="red" icon="✕" title="QR fully used">
          Darshan was done{view.darshanAt ? ` on ${formatTime(view.darshanAt)}` : ""} and prasadam was given
          {view.at ? ` on ${formatTime(view.at)}` : ""}. Nothing more to give on this ticket.
        </Banner>
      );

    case "held":
      return (
        <Banner tone="green" icon="₹" title="Payment recorded">
          ₹{amount} received. Darshan is on hold: scan this same QR again when the devotee goes for darshan.
        </Banner>
      );

    case "unpaid":
      return (
        <Banner tone="amber" icon="₹" title="Payment pending">
          ₹{amount} has not been paid. Collect it at the counter, then choose:
          <ActionButton disabled={pending} onClick={() => checkIn({ collectPayment: true })}>
            {pending ? "Saving…" : `Collected ₹${amount}: darshan now`}
          </ActionButton>
          <ActionButton
            variant="outline"
            disabled={pending}
            onClick={() =>
              act(async () => {
                const r = await collectPaymentHoldDarshan(reference);
                if (r.ok) return { kind: "held" };
                if (r.error === "already_paid") return viewFromCheckIn(await checkInBooking(reference, opts.current));
                return viewFromCheckIn({ ok: false, error: r.error });
              })
            }
          >
            {pending ? "Saving…" : `Collected ₹${amount}: hold darshan for later`}
          </ActionButton>
        </Banner>
      );

    case "wrong_date":
      return (
        <Banner tone="amber" icon="!" title="Ticket is not for today">
          Check the date below before admitting.
          <ActionButton
            disabled={pending}
            onClick={() => checkIn({ anyDate: true })}
          >
            {pending ? "Saving…" : "Mark darshan done anyway"}
          </ActionButton>
        </Banner>
      );

    case "blocked":
      return (
        <Banner tone="red" icon="✕" title={view.title}>
          {view.body}
        </Banner>
      );
  }
}

const tones = {
  green: "border-green-600 bg-green-50 text-green-800",
  blue: "border-sky-600 bg-sky-50 text-sky-900",
  red: "border-red-600 bg-red-50 text-red-800",
  amber: "border-amber-500 bg-amber-50 text-amber-900",
};

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof tones;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${tones[tone]}`} role="status">
      <p className="text-5xl font-bold leading-none">{icon}</p>
      <p className="mt-2 font-display text-3xl">{title}</p>
      <div className="mt-2 text-sm opacity-90">{children}</div>
    </div>
  );
}

function ActionButton({
  children,
  variant = "solid",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" }) {
  return (
    <button
      {...props}
      className={`mt-3 block w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60 ${
        variant === "solid" ? "bg-maroon text-cream" : "border-2 border-maroon bg-white text-maroon"
      }`}
    >
      {children}
    </button>
  );
}

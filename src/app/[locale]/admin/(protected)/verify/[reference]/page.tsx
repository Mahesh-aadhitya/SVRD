import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CheckInPanel from "@/components/admin/CheckInPanel";
import { requireAdmin } from "@/lib/admin/dal";
import { getBookingForTicket } from "@/lib/data/bookings";
import { todayInIndia, formatIso } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";
import { nakshatraLabel } from "@/lib/nakshatras";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Where a ticket QR lands when a signed-in admin scans it with the phone
// camera (the public ticket page redirects here). Shows the booking and
// payment state, and checks the ticket in — after which the QR is spent.
export default async function VerifyTicketPage({ params }: { params: Promise<{ locale: string; reference: string }> }) {
  const { locale, reference } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale as Locale);

  const ref = reference.toUpperCase();
  const ticket = await getBookingForTicket(ref);
  const lang = locale === "kn" ? "kn" : "en";

  if (!ticket) {
    return (
      <div>
        <AdminPageHeader title="Verify ticket" />
        <div className="rounded-2xl border-2 border-red-600 bg-red-50 p-6 text-center">
          <p className="text-4xl">✕</p>
          <p className="mt-2 font-display text-2xl text-red-700">Invalid ticket</p>
          <p className="mt-1 text-sm text-red-700/80">No booking with reference {ref}.</p>
        </div>
      </div>
    );
  }

  const isToday = ticket.date === todayInIndia();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
  const paymentLabel =
    ticket.amount === 0
      ? "Free seva"
      : ticket.paymentStatus === "paid"
        ? `Paid ₹${ticket.amount}`
        : ticket.paymentStatus === "refunded"
          ? `Refunded ₹${ticket.amount}`
          : ticket.paymentStatus === "submitted"
            ? `UPI submitted ₹${ticket.amount}${ticket.paymentUtr ? ` · UTR ${ticket.paymentUtr}` : ""} — not yet verified`
            : `NOT PAID — ₹${ticket.amount} due`;
  const paymentOk = ticket.amount === 0 || ticket.paymentStatus === "paid";

  const rows: [string, React.ReactNode][] = [
    ["Reference", <span key="r" className="font-mono font-bold tracking-widest">{ticket.reference}</span>],
    ["Seva", <strong key="s">{ticket.sevaName[lang]}</strong>],
    [
      "Date",
      <span key="d" className={isToday ? "font-semibold" : "font-semibold text-amber-700"}>
        {formatIso(ticket.date, lang, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        {isToday ? " (today)" : " — not today"}
      </span>,
    ],
    ["Time", ticket.slot ? formatSlot(ticket.slot, lang) : "Any time that day"],
    ["Tickets", <strong key="q">{ticket.quantity}</strong>],
    [
      "Payment",
      <span
        key="p"
        className={`rounded-full px-2.5 py-1 text-xs font-bold ${paymentOk ? "bg-green-600/15 text-green-700" : "bg-red-600/15 text-red-700"}`}
      >
        {paymentLabel}
      </span>,
    ],
    ["Booking status", <span key="st" className="capitalize">{ticket.status}</span>],
    [
      "Darshan",
      ticket.checkedInAt ? <span key="dn" className="font-semibold text-green-700">✓ {fmt(ticket.checkedInAt)}</span> : "Not yet",
    ],
    [
      "Prasadam",
      ticket.prasadamClaimedAt ? (
        <span key="pr" className="font-semibold text-green-700">✓ {fmt(ticket.prasadamClaimedAt)}</span>
      ) : (
        "Not yet"
      ),
    ],
    ["Phone", <a key="ph" href={`tel:${ticket.phone}`} className="text-maroon underline">{ticket.phone}</a>],
  ];

  return (
    <div className="mx-auto max-w-xl">
      <AdminPageHeader title="Verify ticket" />

      <CheckInPanel
        reference={ref}
        amount={ticket.amount}
        initialCheckedInAt={ticket.checkedInAt}
        initialPrasadamClaimedAt={ticket.prasadamClaimedAt}
      />

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-ink/10 last:border-0">
                <td className="w-32 bg-black/[0.03] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</td>
                <td className="px-4 py-2.5 text-ink">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-ink/50">Devotees</p>
      <ol className="space-y-2 rounded-2xl border border-ink/10 p-4">
        {ticket.devotees.map((d, i) => (
          <li key={i}>
            <p className="font-medium text-ink">
              <span className="mr-1 text-ink/40">{i + 1}.</span>
              {d.name}
            </p>
            {d.gotram || d.nakshatram ? (
              <p className="text-xs text-ink/55">
                {[d.gotram && `${d.gotram} gotram`, d.nakshatram && `${nakshatraLabel(d.nakshatram, lang)} nakshatram`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <Link href="/admin/bookings" className="mt-6 inline-block text-sm font-semibold text-maroon hover:underline">
        ← All bookings
      </Link>
    </div>
  );
}

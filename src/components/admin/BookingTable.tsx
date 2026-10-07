import { useLocale } from "next-intl";
import { setBookingStatus, setBookingPaymentStatus } from "@/lib/actions/bookings";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import type { Locale } from "@/i18n/routing";
import type { Booking } from "@/lib/content-types";
import { formatSlot, type Seva } from "@/lib/seva-types";

const statusStyles: Record<Booking["status"], string> = {
  confirmed: "bg-gold/20 text-maroon",
  pending: "bg-black/5 text-ink/60",
  cancelled: "bg-red-500/15 text-red-600",
};

const paymentStyles: Record<Booking["paymentStatus"], string> = {
  paid: "bg-green-600/15 text-green-700",
  unpaid: "bg-black/5 text-ink/60",
  submitted: "bg-amber-500/15 text-amber-800",
  refunded: "bg-blue-600/10 text-blue-700",
};

const actionClass = "text-xs font-semibold text-maroon hover:underline";

export default function BookingTable({ bookings, sevas }: { bookings: Booking[]; sevas: Seva[] }) {
  const locale = useLocale() as Locale;

  if (bookings.length === 0) {
    return <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No bookings found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3 font-medium">Ref</th>
            <th className="px-4 py-3 font-medium">Devotee</th>
            <th className="px-4 py-3 font-medium">Seva</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const seva = sevas.find((s) => s.id === booking.sevaId);
            const isPaidSeva = booking.amount > 0;
            return (
              <tr key={booking.id} className="border-t border-ink/10 align-top">
                <td className="px-4 py-3 font-mono text-xs text-ink/70">{booking.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  <ol className="space-y-1">
                    {booking.devotees.map((d, i) => (
                      <li key={i}>
                        <p className="font-medium text-ink">
                          {booking.devotees.length > 1 ? <span className="mr-1 text-ink/40">{i + 1}.</span> : null}
                          {d.name}
                        </p>
                        {d.gotram || d.nakshatram ? (
                          <p className="text-xs text-ink/55">
                            {[d.gotram && `${d.gotram} gotram`, d.nakshatram && `${d.nakshatram} nakshatram`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <a href={`tel:${booking.phone}`} className="mt-1 inline-block text-xs text-ink/50 hover:text-maroon">
                    {booking.phone}
                  </a>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {seva?.name[locale] ?? booking.sevaId}
                  <p className="text-xs font-semibold text-maroon">
                    {booking.quantity} ticket{booking.quantity === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                  {new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {booking.slot ? <p className="text-xs text-ink/50">{formatSlot(booking.slot, "en")}</p> : null}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {isPaidSeva ? `₹${booking.amount}` : "Free"}
                  {isPaidSeva ? (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] capitalize ${paymentStyles[booking.paymentStatus]}`}>
                      {booking.paymentStatus === "submitted" ? "UPI · verify" : booking.paymentStatus}
                    </span>
                  ) : null}
                  {booking.paymentUtr ? <p className="mt-1 font-mono text-[11px] text-ink/50">UTR {booking.paymentUtr}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusStyles[booking.status]}`}>
                    {booking.status}
                  </span>
                  {booking.checkedInAt ? (
                    <p className="mt-1.5 whitespace-nowrap text-[11px] font-semibold text-green-700">
                      ✓ Darshan done{" "}
                      {new Date(booking.checkedInAt).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: "Asia/Kolkata",
                      })}
                      {booking.prasadamClaimedAt ? " · Prasadam ✓" : " · Prasadam pending"}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-3">
                    {booking.status !== "cancelled" && isPaidSeva && (booking.paymentStatus === "unpaid" || booking.paymentStatus === "submitted") ? (
                      <form action={setBookingPaymentStatus.bind(null, booking.id, "paid")}>
                        <button className={actionClass}>Mark paid</button>
                      </form>
                    ) : null}
                    {booking.status === "pending" ? (
                      <form action={setBookingStatus.bind(null, booking.id, "confirmed")}>
                        <button className={actionClass}>Confirm</button>
                      </form>
                    ) : null}
                    {booking.status !== "cancelled" ? (
                      <form action={setBookingStatus.bind(null, booking.id, "cancelled")}>
                        <ConfirmSubmitButton
                          message={`Cancel booking ${booking.reference ?? ""} for ${booking.devoteeName}?`}
                        >
                          Cancel
                        </ConfirmSubmitButton>
                      </form>
                    ) : (
                      <form action={setBookingStatus.bind(null, booking.id, "pending")}>
                        <button className={actionClass}>Restore</button>
                      </form>
                    )}
                    {booking.status === "cancelled" && booking.paymentStatus === "paid" ? (
                      <form action={setBookingPaymentStatus.bind(null, booking.id, "refunded")}>
                        <button className={actionClass}>Mark refunded</button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

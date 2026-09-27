import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { bookings, sevas } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

const statusStyles: Record<string, string> = {
  confirmed: "bg-gold/20 text-maroon",
  pending: "bg-black/5 text-ink/60",
  cancelled: "bg-red-500/15 text-red-600",
};

export default async function AdminBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;

  return (
    <div>
      <AdminPageHeader title={t("nav.bookings")} />
      <div className="overflow-hidden rounded-2xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Devotee</th>
              <th className="px-4 py-3 font-medium">Seva</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const seva = sevas.find((s) => s.id === booking.sevaId);
              return (
                <tr key={booking.id} className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{booking.devoteeName}</p>
                    <p className="text-xs text-ink/50">{booking.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{seva?.name[locale] ?? booking.sevaId}</td>
                  <td className="px-4 py-3 text-ink/70">{booking.date}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {booking.amount === 0 ? "Free" : `₹${booking.amount}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusStyles[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

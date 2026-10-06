import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DatePickerField from "@/components/calendar/DatePickerField";
import { getDarshanLogForAdmin } from "@/lib/data/bookings";
import { getAllSevasForAdmin } from "@/lib/data/sevas";
import { formatIso, todayInIndia } from "@/lib/dates";
import { formatSlot, type Seva } from "@/lib/seva-types";
import { nakshatraLabel } from "@/lib/nakshatras";
import type { Locale } from "@/i18n/routing";
import type { Booking } from "@/lib/content-types";

// Everyone who took darshan on a day (by QR scan time, IST), in scan order.
export default async function DarshanLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const date = sp.date?.match(/^\d{4}-\d{2}-\d{2}$/) ? sp.date : todayInIndia();
  const [{ bookings, prasadamGiven }, sevas] = await Promise.all([getDarshanLogForAdmin(date), getAllSevasForAdmin()]);
  return <Content date={date} bookings={bookings} prasadamGiven={prasadamGiven} sevas={sevas} />;
}

const istDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function Content({
  date,
  bookings,
  prasadamGiven,
  sevas,
}: {
  date: string;
  bookings: Booking[];
  prasadamGiven: number;
  sevas: Seva[];
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const sevaName = (id: string) => sevas.find((s) => s.id === id)?.name[locale] ?? id;
  const devoteeCount = bookings.reduce((n, b) => n + b.devotees.length, 0);
  const prasadamPending = bookings.filter((b) => !b.prasadamClaimedAt).length;
  const isToday = date === todayInIndia();

  const stats: [string, number][] = [
    ["Devotees", devoteeCount],
    ["Tickets scanned", bookings.length],
    ["Prasadam given today", prasadamGiven],
    ["Prasadam pending", prasadamPending],
  ];

  return (
    <div>
      <AdminPageHeader
        title={t("nav.darshan")}
        action={
          <a
            href={`/api/admin/bookings/export?view=darshan&date=${date}`}
            className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
          >
            Download list (CSV)
          </a>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <DatePickerField name="date" defaultValue={date} allowPast compact />
        <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">Show</button>
        {!isToday ? (
          <a href="?" className="px-2 py-2 text-xs font-semibold text-ink/50 hover:text-maroon">
            Today
          </a>
        ) : null}
      </form>

      <p className="mb-3 text-sm text-ink/60">
        Darshan on{" "}
        <strong className="text-ink">
          {formatIso(date, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </strong>
        {isToday ? " (today)" : ""}
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-ink/10 p-4">
            <p className="text-2xl font-bold text-maroon">{value}</p>
            <p className="text-xs text-ink/55">{label}</p>
          </div>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No darshan recorded for this day.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Scanned</th>
                <th className="px-4 py-3 font-medium">Devotees</th>
                <th className="px-4 py-3 font-medium">Seva</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Prasadam</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-ink/10 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{time(b.checkedInAt!)}</td>
                  <td className="px-4 py-3">
                    <ol className="space-y-1">
                      {b.devotees.map((d, i) => (
                        <li key={i}>
                          <p className="font-medium text-ink">
                            {b.devotees.length > 1 ? <span className="mr-1 text-ink/40">{i + 1}.</span> : null}
                            {d.name}
                          </p>
                          {d.gotram || d.nakshatram ? (
                            <p className="text-xs text-ink/55">
                              {[d.gotram && `${d.gotram} gotram`, d.nakshatram && `${nakshatraLabel(d.nakshatram, locale)} nakshatram`]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                    <a href={`tel:${b.phone}`} className="mt-1 inline-block text-xs text-ink/50 hover:text-maroon">
                      {b.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {sevaName(b.sevaId)}
                    <p className="text-xs text-ink/50">
                      {b.slot ? formatSlot(b.slot, locale) : "Whole day"}
                      {b.date !== date ? ` · booked for ${formatIso(b.date, locale, { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/admin/verify/${b.reference}`} className="text-maroon hover:underline">
                      {b.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{b.amount === 0 ? "Free" : `₹${b.amount} ${b.paymentStatus}`}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {b.prasadamClaimedAt ? (
                      <span className="text-xs font-semibold text-green-700">
                        ✓ {istDay(b.prasadamClaimedAt) === date
                          ? time(b.prasadamClaimedAt)
                          : formatIso(istDay(b.prasadamClaimedAt), locale, { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

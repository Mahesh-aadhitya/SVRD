import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BookingTable from "@/components/admin/BookingTable";
import DatePickerField from "@/components/calendar/DatePickerField";
import { getBookingsForAdmin, type BookingFilters } from "@/lib/data/bookings";
import { getAllSevasForAdmin } from "@/lib/data/sevas";
import type { Locale } from "@/i18n/routing";
import type { Booking, BookingStatus } from "@/lib/content-types";
import type { Seva } from "@/lib/seva-types";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];

function pick(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const status = pick(sp.status) as BookingStatus | undefined;
  const filters: BookingFilters = {
    status: status && STATUSES.includes(status) ? status : undefined,
    sevaId: pick(sp.seva),
    date: pick(sp.date)?.match(/^\d{4}-\d{2}-\d{2}$/) ? pick(sp.date) : undefined,
    q: pick(sp.q)?.slice(0, 60),
  };
  const [bookings, sevas] = await Promise.all([getBookingsForAdmin(filters), getAllSevasForAdmin()]);
  return <Content bookings={bookings} sevas={sevas} filters={filters} />;
}

function Content({ bookings, sevas, filters }: { bookings: Booking[]; sevas: Seva[]; filters: BookingFilters }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const exportQuery = new URLSearchParams(
    Object.entries({ status: filters.status, seva: filters.sevaId, date: filters.date, q: filters.q }).filter(
      (entry): entry is [string, string] => !!entry[1],
    ),
  ).toString();
  const inputClass =
    "rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold";

  return (
    <div>
      <AdminPageHeader
        title={t("nav.bookings")}
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/bookings/export?view=devotees${filters.date ? `&date=${filters.date}` : ""}${
                filters.sevaId ? `&seva=${encodeURIComponent(filters.sevaId)}` : ""
              }`}
              className="rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark"
            >
              {filters.date ? "Devotee list for this date" : "Today's devotee list"}
            </a>
            <a
              href={`/api/admin/bookings/export${exportQuery ? `?${exportQuery}` : ""}`}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-maroon hover:bg-black/[0.03]"
            >
              Export CSV
            </a>
          </div>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={filters.q} placeholder="Name, phone or reference" className={`${inputClass} min-w-48 flex-1`} />
        <select name="status" defaultValue={filters.status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <select name="seva" defaultValue={filters.sevaId ?? ""} className={inputClass}>
          <option value="">All sevas</option>
          {sevas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name[locale]}
            </option>
          ))}
        </select>
        <DatePickerField name="date" defaultValue={filters.date} allowPast clearable compact placeholder="Any date" />
        <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">
          Filter
        </button>
        <a href="?" className="px-2 py-2 text-xs font-semibold text-ink/50 hover:text-maroon">
          Clear
        </a>
      </form>

      <BookingTable bookings={bookings} sevas={sevas} />
    </div>
  );
}

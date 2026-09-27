import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getEvents } from "@/lib/data/events";
import type { Locale } from "@/i18n/routing";
import type { TempleEvent } from "@/lib/placeholder-data";

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const events = await getEvents();
  return <Content events={events} />;
}

function Content({ events }: { events: TempleEvent[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;

  return (
    <div>
      <AdminPageHeader
        title={t("nav.events")}
        action={
          <Link
            href="/admin/events/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105"
          >
            + {t("actions.add")}
          </Link>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-ink/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">{t("actions.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-medium text-ink">{event.title[locale]}</td>
                <td className="px-4 py-3 text-ink/70">
                  {new Date(event.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="text-xs font-semibold text-maroon hover:underline"
                  >
                    {t("actions.edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

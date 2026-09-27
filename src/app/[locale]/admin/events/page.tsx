import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { events } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

export default async function AdminEventsPage({
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
      <AdminPageHeader
        title={t("nav.events")}
        action={
          <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">
            + {t("actions.add")}
          </button>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-cream/50">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">{t("actions.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-cream">{event.title[locale]}</td>
                <td className="px-4 py-3 text-cream/70">
                  {new Date(event.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs font-semibold text-gold-light hover:underline">
                    {t("actions.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

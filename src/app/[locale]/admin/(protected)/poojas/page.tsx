import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getPoojas } from "@/lib/data/poojas";
import type { Locale } from "@/i18n/routing";
import type { Pooja } from "@/lib/placeholder-data";

export default async function AdminPoojasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const poojas = await getPoojas();
  return <Content poojas={poojas} />;
}

function Content({ poojas }: { poojas: Pooja[] }) {
  const t = useTranslations("admin");
  const tPoojas = useTranslations("poojas");
  const locale = useLocale() as Locale;

  return (
    <div>
      <AdminPageHeader
        title={t("nav.poojas")}
        action={
          <Link
            href="/admin/poojas/new"
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
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">{tPoojas("timingsLabel")}</th>
              <th className="px-4 py-3 font-medium">{tPoojas("bookableTag")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("actions.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {poojas.map((pooja) => (
              <tr key={pooja.id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-medium text-ink">{pooja.name[locale]}</td>
                <td className="px-4 py-3 text-ink/70">{pooja.timing}</td>
                <td className="px-4 py-3">
                  {pooja.isBookable ? (
                    <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs text-maroon">Yes</span>
                  ) : (
                    <span className="text-ink/40">–</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/poojas/${pooja.id}/edit`}
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

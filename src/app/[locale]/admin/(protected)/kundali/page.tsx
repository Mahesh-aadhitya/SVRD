import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import KundaliView from "@/components/panchangam/KundaliView";

// Janma kundali / jataka for the temple office — admin only (the protected
// layout checks the session), never offered to devotees on the site.
export default async function AdminKundaliPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Content />;
}

function Content() {
  const t = useTranslations("admin");
  const locale = useLocale();
  return (
    <div>
      <AdminPageHeader title={t("nav.kundali")} />
      <div className="overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,#1b1340,#05030f_70%)] py-5 text-white/90">
        <KundaliView locale={locale} />
      </div>
    </div>
  );
}

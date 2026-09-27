import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import LiveControlPanel from "@/components/admin/LiveControlPanel";
import { getLiveConfig } from "@/lib/data/live";
import type { LiveConfig } from "@/lib/data/live";

export default async function AdminLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const config = await getLiveConfig();
  return <Content config={config} />;
}

function Content({ config }: { config: LiveConfig }) {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader title={t("nav.live")} />
      <LiveControlPanel config={config} />
    </div>
  );
}

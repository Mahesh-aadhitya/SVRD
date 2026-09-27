import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SevaTicketTable from "@/components/admin/SevaTicketTable";

export default async function AdminSevasPage({
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

  return (
    <div>
      <AdminPageHeader
        title={t("nav.sevas")}
        action={
          <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">
            + {t("actions.add")}
          </button>
        }
      />
      <SevaTicketTable />
    </div>
  );
}

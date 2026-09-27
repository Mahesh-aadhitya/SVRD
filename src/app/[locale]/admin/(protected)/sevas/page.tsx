import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SevaTicketTable from "@/components/admin/SevaTicketTable";
import { getAllSevasForAdmin } from "@/lib/data/sevas";

export default async function AdminSevasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sevas = await getAllSevasForAdmin();
  return <Content sevas={sevas} />;
}

function Content({ sevas }: { sevas: Awaited<ReturnType<typeof getAllSevasForAdmin>> }) {
  const t = useTranslations("admin");

  return (
    <div>
      <AdminPageHeader
        title={t("nav.sevas")}
        action={
          <Link
            href="/admin/sevas/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105"
          >
            + {t("actions.add")}
          </Link>
        }
      />
      <SevaTicketTable sevas={sevas} />
    </div>
  );
}

import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderManager from "@/components/admin/FolderManager";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree, type Folder } from "@/lib/folders";
import SevaTicketTable from "@/components/admin/SevaTicketTable";
import { getAllSevasForAdmin } from "@/lib/data/sevas";
import { getUpcomingBookingCountsForAdmin } from "@/lib/data/bookings";

export default async function AdminSevasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sevas, folders, upcomingBookings] = await Promise.all([
    getAllSevasForAdmin(),
    getFolders("sevas"),
    getUpcomingBookingCountsForAdmin(),
  ]);
  return <Content sevas={sevas} folders={folders} upcomingBookings={upcomingBookings} />;
}

function Content({
  sevas,
  folders,
  upcomingBookings,
}: {
  sevas: Awaited<ReturnType<typeof getAllSevasForAdmin>>;
  folders: Folder[];
  upcomingBookings: Record<string, number>;
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;

  return (
    <div className="space-y-10">
      <div>
        <AdminPageHeader
          title={t("nav.sevas")}
          action={
            <Link
              href="/admin/sevas/new"
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105"
            >
              + Add a seva
            </Link>
          }
        />
        <SevaTicketTable sevas={sevas} folders={folders} upcomingBookings={upcomingBookings} />
      </div>
      <FolderManager section="sevas" basePath="/admin/sevas" tree={buildFolderTree(folders)} locale={locale} />
    </div>
  );
}

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import StatCard from "@/components/admin/StatCard";
import { bookings } from "@/lib/placeholder-data";
import { getEvents } from "@/lib/data/events";
import { getGalleryItems } from "@/lib/data/gallery";
import { getAllSevasForAdmin } from "@/lib/data/sevas";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [events, gallery, sevas] = await Promise.all([
    getEvents(),
    getGalleryItems(),
    getAllSevasForAdmin(),
  ]);
  return <DashboardContent eventsCount={events.length} galleryCount={gallery.length} sevasCount={sevas.length} />;
}

function DashboardContent({
  eventsCount,
  galleryCount,
  sevasCount,
}: {
  eventsCount: number;
  galleryCount: number;
  sevasCount: number;
}) {
  const t = useTranslations("admin.dashboard");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-maroon">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("totalBookings")} value={bookings.length} />
        <StatCard label={t("todaySevas")} value={sevasCount} />
        <StatCard label={t("upcomingEvents")} value={eventsCount} />
        <StatCard label={t("galleryItems")} value={galleryCount} />
      </div>
    </div>
  );
}

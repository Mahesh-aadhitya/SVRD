import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import StatCard from "@/components/admin/StatCard";
import { bookings, events, gallery, sevas } from "@/lib/placeholder-data";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardContent />;
}

function DashboardContent() {
  const t = useTranslations("admin.dashboard");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-gold-light">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("totalBookings")} value={bookings.length} />
        <StatCard label={t("todaySevas")} value={sevas.length} />
        <StatCard label={t("upcomingEvents")} value={events.length} />
        <StatCard label={t("galleryItems")} value={gallery.length} />
      </div>
    </div>
  );
}

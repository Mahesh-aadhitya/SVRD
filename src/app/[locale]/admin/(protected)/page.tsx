import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import StatCard from "@/components/admin/StatCard";
import BookingTable from "@/components/admin/BookingTable";
import { getEvents } from "@/lib/data/events";
import { getGalleryItems } from "@/lib/data/gallery";
import { getSongs } from "@/lib/data/songs";
import { getAllSevasForAdmin } from "@/lib/data/sevas";
import { getLiveConfig } from "@/lib/data/live";
import { getCommentCountForAdmin } from "@/lib/data/comments";
import { getBookingStatsForAdmin, getBookingsForAdmin, type BookingStats } from "@/lib/data/bookings";
import { todayInIndia } from "@/lib/dates";
import type { Booking } from "@/lib/content-types";
import type { Seva } from "@/lib/seva-types";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const today = todayInIndia();
  const [events, gallery, songs, sevas, live, commentCount, stats, todayBookings] = await Promise.all([
    getEvents(),
    getGalleryItems(),
    getSongs(),
    getAllSevasForAdmin(),
    getLiveConfig(),
    getCommentCountForAdmin(),
    getBookingStatsForAdmin(),
    getBookingsForAdmin({ date: today }),
  ]);

  return (
    <DashboardContent
      stats={stats}
      upcomingEvents={events.filter((e) => e.date >= today).length}
      galleryCount={gallery.length}
      songCount={songs.length}
      openSevas={sevas.filter((s) => s.isActive).length}
      isLive={live.isLive}
      commentCount={commentCount}
      todayBookings={todayBookings}
      sevas={sevas}
    />
  );
}

function DashboardContent({
  stats,
  upcomingEvents,
  galleryCount,
  songCount,
  openSevas,
  isLive,
  commentCount,
  todayBookings,
  sevas,
}: {
  stats: BookingStats;
  upcomingEvents: number;
  galleryCount: number;
  songCount: number;
  openSevas: number;
  isLive: boolean;
  commentCount: number;
  todayBookings: Booking[];
  sevas: Seva[];
}) {
  const t = useTranslations("admin.dashboard");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-maroon">{t("title")}</h1>
        <Link
          href="/admin/live"
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            isLive ? "bg-gold/20 text-maroon" : "bg-black/5 text-ink/50"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-maroon" : "bg-ink/30"}`} />
          {isLive ? "Live stream is on" : "Live stream is off"}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("todayBookings")} value={stats.today} />
        <StatCard label={t("pendingBookings")} value={stats.pending} />
        <StatCard label={t("upcomingBookings")} value={stats.upcoming} />
        <StatCard label={t("totalBookings")} value={stats.total} />
        <StatCard label={t("openSevas")} value={openSevas} />
        <StatCard label={t("upcomingEvents")} value={upcomingEvents} />
        <StatCard label={t("galleryItems")} value={galleryCount} />
        <StatCard label={t("songsAndComments")} value={`${songCount} / ${commentCount}`} />
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">{t("todayBookings")}</h2>
          <div className="flex items-center gap-4">
            {/* A file download, not a page — a plain link avoids client-side navigation/prefetch. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/admin/bookings/export?view=devotees"
              className="rounded-full bg-maroon px-3 py-1.5 text-xs font-semibold text-cream hover:bg-maroon-dark"
            >
              Download today&apos;s devotee list
            </a>
            <Link href="/admin/bookings" className="text-xs font-semibold text-maroon hover:underline">
              {t("allBookings")} →
            </Link>
          </div>
        </div>
        <BookingTable bookings={todayBookings} sevas={sevas} />
      </div>
    </div>
  );
}

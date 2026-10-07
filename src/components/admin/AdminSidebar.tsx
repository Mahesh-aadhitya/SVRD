"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const items = [
  { href: "/admin", key: "dashboard", exact: true },
  { href: "/admin/notices", key: "notices" },
  { href: "/admin/events", key: "events" },
  { href: "/admin/gallery", key: "gallery" },
  { href: "/admin/songs", key: "songs" },
  { href: "/admin/sevas", key: "sevas" },
  { href: "/admin/bookings", key: "bookings" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/darshan", key: "darshan" },
  { href: "/admin/donations", key: "donations" },
  { href: "/admin/live", key: "live" },
  { href: "/admin/comments", key: "comments" },
  { href: "/admin/kundali", key: "kundali" },
  { href: "/admin/verses", key: "verses" },
  { href: "/admin/acharyas", key: "acharyas" },
  { href: "/admin/temple", key: "temple" },
] as const;

export default function AdminSidebar() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 py-2 lg:w-60 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-r lg:border-ink/10 lg:px-3 lg:py-6">
      {items.map((item) => {
        const isExact = "exact" in item && item.exact;
        const active = isExact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-gold/20 text-maroon"
                : "text-ink/70 hover:bg-black/[0.03] hover:text-ink"
            }`}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import AccountButton from "./account/AccountButton";
import NavBeacon from "./highlights/NavBeacon";
import NotificationBell from "./highlights/NotificationBell";

const navItems = [
  { href: "/", key: "home" },
  { href: "/sevas", key: "sevas" },
  { href: "/events", key: "events" },
  { href: "/panchangam", key: "panchangam" },
  { href: "/gallery", key: "gallery" },
  { href: "/songs", key: "songs" },
  { href: "/live", key: "live" },
  { href: "/donate", key: "donate" },
  { href: "/about", key: "about" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tMeta = useTranslations("meta");

  return (
    <header className="relative z-40 overflow-hidden border-b border-gold/30 bg-cream">
      {/* Small full-colour pillars span the header's full height (all
          three rows) at the far ends, instead of being sized to just
          one row */}
      <Image
        src="/images/mural-side-left.png"
        alt=""
        width={519}
        height={1104}
        aria-hidden
        className="absolute left-0 top-0 hidden h-full w-20 object-contain object-[left_top] sm:block md:w-28"
      />
      <Image
        src="/images/mural-side-right.png"
        alt=""
        width={519}
        height={1104}
        aria-hidden
        className="absolute right-0 top-0 hidden h-full w-20 object-contain object-[right_top] sm:block md:w-28"
      />

      {/* Utility row: language switcher and account, always reachable */}
      <div className="relative mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 pt-2.5 sm:px-6">
        <LanguageSwitcher />
        {/* Phones have no nav row (bottom nav instead), so the avatar sits here. */}
        <span className="flex items-center gap-2 lg:hidden">
          <NotificationBell />
          <AccountButton />
        </span>
      </div>

      {/* Brand block: logo big and centered, name beneath it */}
      <Link
        href="/"
        className="relative flex flex-col items-center gap-2 px-4 pb-4 pt-1 text-center sm:pb-5"
      >
        <Image
          src="/images/emblem-full.png"
          alt={tMeta("siteTitle")}
          width={850}
          height={268}
          priority
          className="h-16 w-auto sm:h-20"
        />
        <span className="brand-title font-display whitespace-nowrap text-[clamp(1rem,5.2vw,1.875rem)] leading-tight text-maroon">
          {tMeta("siteTitle")}
        </span>
      </Link>

      {/* Desktop nav row (mobile relies on the bottom nav) */}
      <nav className="relative hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gold/20 px-24 py-3 lg:flex xl:px-28">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="text-sm font-medium text-ink/80 transition-colors hover:text-maroon"
          >
            {t(item.key)}
            <NavBeacon href={item.href} />
          </Link>
        ))}
        <Link
          href="/booking"
          className="rounded-full bg-maroon px-4 py-1.5 text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-[1.03] hover:bg-maroon-dark"
        >
          {t("booking")}
          <NavBeacon href="/booking" onDark />
        </Link>
        <span className="flex items-center gap-1">
          <NotificationBell />
          <AccountButton compact />
        </span>
      </nav>
    </header>
  );
}

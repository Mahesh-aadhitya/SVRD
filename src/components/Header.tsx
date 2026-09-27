import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { href: "/", key: "home" },
  { href: "/poojas", key: "poojas" },
  { href: "/events", key: "events" },
  { href: "/gallery", key: "gallery" },
  { href: "/songs", key: "songs" },
  { href: "/live", key: "live" },
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

      {/* Utility row: language switcher, always reachable */}
      <div className="relative mx-auto flex max-w-6xl justify-end px-4 pt-2.5 sm:px-6">
        <LanguageSwitcher />
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
        <span className="font-display text-2xl leading-tight text-maroon sm:text-3xl">
          {tMeta("siteTitle")}
        </span>
      </Link>

      {/* Desktop nav row (mobile relies on the bottom nav) */}
      <nav className="relative hidden items-center justify-center gap-6 border-t border-gold/20 py-3 lg:flex">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="text-sm font-medium text-ink/80 transition-colors hover:text-maroon"
          >
            {t(item.key)}
          </Link>
        ))}
        <Link
          href="/booking"
          className="rounded-full bg-maroon px-4 py-1.5 text-sm font-semibold text-cream shadow-sm transition-transform hover:scale-[1.03] hover:bg-maroon-dark"
        >
          {t("booking")}
        </Link>
      </nav>
    </header>
  );
}

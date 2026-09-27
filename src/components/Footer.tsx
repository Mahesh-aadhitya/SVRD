import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { templeInfo } from "@/lib/placeholder-data";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tMeta = useTranslations("meta");

  return (
    <footer className="mt-16 border-t border-gold/30 bg-maroon text-cream/90">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-gold-light">
              {tMeta("siteTitle")}
            </p>
            <p className="mt-2 text-sm text-cream/70">{t("tagline")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gold-light">
              {tNav("about")}
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-cream/75">
              <li>{templeInfo.addressLine1}</li>
              <li>{templeInfo.addressLine2}</li>
              <li>{templeInfo.phone}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2 text-sm text-cream/75">
            <Link href="/poojas" className="hover:text-gold-light">
              {tNav("poojas")}
            </Link>
            <Link href="/events" className="hover:text-gold-light">
              {tNav("events")}
            </Link>
            <Link href="/gallery" className="hover:text-gold-light">
              {tNav("gallery")}
            </Link>
            <Link href="/admin" className="hover:text-gold-light">
              {tNav("admin")}
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-cream/15 pt-6 text-xs text-cream/50">
          {"©"} {new Date().getFullYear()} {tMeta("siteTitle")}
        </p>
      </div>
    </footer>
  );
}

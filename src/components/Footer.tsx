import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TempleInfo } from "@/lib/content-types";
import AdminLink from "./AdminLink";

export default function Footer({ info }: { info: TempleInfo }) {
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
              {info.addressLine1 ? <li>{info.addressLine1}</li> : null}
              {info.addressLine2 ? <li>{info.addressLine2}</li> : null}
              {info.phone ? (
                <li>
                  <a href={`tel:${info.phone.replace(/\s/g, "")}`} className="hover:text-gold-light">
                    {info.phone}
                  </a>
                </li>
              ) : null}
              {info.email ? (
                <li>
                  <a href={`mailto:${info.email}`} className="hover:text-gold-light">
                    {info.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="flex flex-col gap-2 text-sm text-cream/75">
            <Link href="/sevas" className="hover:text-gold-light">
              {tNav("sevas")}
            </Link>
            <Link href="/events" className="hover:text-gold-light">
              {tNav("events")}
            </Link>
            <Link href="/gallery" className="hover:text-gold-light">
              {tNav("gallery")}
            </Link>
            <AdminLink className="hover:text-gold-light" />
          </div>
        </div>
        <p className="mt-8 border-t border-cream/15 pt-6 text-xs text-cream/50">
          {"©"} {new Date().getFullYear()} {tMeta("siteTitle")}
        </p>
      </div>
    </footer>
  );
}

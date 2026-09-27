"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wide">
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-2">
          {i > 0 ? <span className="text-gold/50">|</span> : null}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            aria-current={locale === loc}
            className={`transition-colors ${
              locale === loc
                ? "font-semibold text-maroon underline decoration-gold underline-offset-4"
                : "text-ink/50 hover:text-maroon"
            }`}
          >
            {t(loc)}
          </button>
        </span>
      ))}
    </div>
  );
}

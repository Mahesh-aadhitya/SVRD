"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ShareButton from "@/components/ShareButton";
import ZoomablePortrait from "@/components/acharya/ZoomablePortrait";
import { acharyaPath, mediaFor, tirunakshatramOf, type Acharya, type AcharyaUploads } from "@/lib/panchang/acharyas";
import { NAKSHATRA_NAMES, label } from "@/lib/panchang/names";

// On an Alwar's or Acharya's tirunakshatram: their picture, who they were,
// and a link to their life and works.
export default function TirunakshatramCard({
  acharyas,
  uploads,
  locale,
}: {
  acharyas: Acharya[];
  uploads: AcharyaUploads;
  locale: string;
}) {
  const t = useTranslations("panchangam");
  if (acharyas.length === 0) return null;

  return (
    <div className="mx-auto mt-4 max-w-xl space-y-2 text-left">
      {acharyas.map((a) => {
        const name = label(a.name, locale);
        const tn = tirunakshatramOf(a);
        const { imageUrl, imageFullUrl, audioUrl } = mediaFor(a, uploads);
        return (
          <div
            key={a.slug}
            className="flex items-center gap-4 rounded-3xl border border-fuchsia-200/40 bg-gradient-to-r from-fuchsia-300/15 via-amber-300/10 to-fuchsia-300/15 px-4 py-3 shadow-[0_0_30px_rgba(240,150,255,0.18)] backdrop-blur"
          >
            <Link href={acharyaPath(a.slug)} aria-label={t("acharya.knowMoreAbout", { name })}>
              <ZoomablePortrait name={name} imageUrl={imageUrl} fullImageUrl={imageFullUrl} size={64} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-widest text-fuchsia-100/80">{t("acharya.todayTitle")}</p>
              <p className="font-display text-lg leading-snug text-amber-50">{name}</p>
              <p className="text-xs text-indigo-100/70">
                {tn ? `${label(tn.month, locale)} · ${label(NAKSHATRA_NAMES[tn.nakshatra], locale)}` : null}
                {audioUrl ? ` · 🎧 ${t("acharya.listenShort")}` : null}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-white/75">{label(a.summary, locale)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  href={acharyaPath(a.slug)}
                  className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-1 text-xs font-semibold text-[#1a0f05] hover:brightness-110"
                >
                  {t("acharya.knowMore")} →
                </Link>
                <ShareButton
                  compact
                  tone="dark"
                  title={`🙏 ${t("acharya.todayTitle")} ${name}`}
                  text={label(a.summary, locale)}
                  path={acharyaPath(a.slug)}
                  imageUrl={imageUrl ?? undefined}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

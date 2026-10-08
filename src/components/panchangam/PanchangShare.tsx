"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider, useTranslations, type AbstractIntlMessages } from "next-intl";
import type { PanchangDay } from "@/lib/panchang/compute";
import { TEMPLE_TOWN, label } from "@/lib/panchang/names";
import type { Verse } from "@/lib/panchang/verses";
import { acharyaPath, mediaFor, type Acharya, type AcharyaUploads } from "@/lib/panchang/acharyas";
import ShareActions, { type ShareLabels } from "./ShareActions";
import ShareCard from "./ShareCard";
import { useDayText } from "./dayText";

type ShareLocale = "en" | "kn";

// The other language's wording, fetched only when someone picks it.
const loadMessages = (l: ShareLocale): Promise<AbstractIntlMessages> =>
  (l === "kn" ? import("../../../messages/kn.json") : import("../../../messages/en.json")).then((m) => m.default as AbstractIntlMessages);

type Props = {
  day: PanchangDay;
  locale: string;
  siteUrl: string;
  /** The device location's name, or null when it's the temple's own panchangam. */
  deviceName: string | null;
  verse?: Verse;
  honoured: Acharya[];
  acharyaMedia: AcharyaUploads;
};

/**
 * Share the day's panchangam (image, PDF or WhatsApp) in Kannada or English,
 * whichever the devotee picks here (Kannada unless they choose English) —
 * without switching the whole site's language. Buttons stay in the page's language; what's shared follows the
 * choice.
 */
export default function PanchangShare(props: Props) {
  const t = useTranslations("panchangam");
  const pageLocale: ShareLocale = props.locale === "kn" ? "kn" : "en";
  // Kannada by default — most devotees forward it in Kannada; one tap for English.
  const [shareLocale, setShareLocale] = useState<ShareLocale>("kn");
  const [loaded, setLoaded] = useState<Partial<Record<ShareLocale, AbstractIntlMessages>>>({});
  const needsOther = shareLocale !== pageLocale;
  const otherMessages = loaded[shareLocale];

  useEffect(() => {
    if (!needsOther || otherMessages) return;
    let cancelled = false;
    loadMessages(shareLocale).then((m) => !cancelled && setLoaded((cur) => ({ ...cur, [shareLocale]: m })));
    return () => {
      cancelled = true;
    };
  }, [needsOther, otherMessages, shareLocale]);

  const labels: ShareLabels = {
    shareImage: t("shareImage"),
    sharePdf: t("sharePdf"),
    whatsapp: t("whatsapp"),
    preparing: t("preparing"),
    shareFailed: t("shareFailed"),
    saved: t("saved"),
  };
  const panel = <SharePanel {...props} locale={shareLocale} labels={labels} />;

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="radiogroup" aria-label={t("shareLanguage")} className="flex items-center gap-2 text-sm">
        <span className="text-indigo-100/60">{t("shareLanguage")}</span>
        <span className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5">
          {(["kn", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={shareLocale === l}
              onClick={() => setShareLocale(l)}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                shareLocale === l ? "bg-amber-300 text-[#1a0f05]" : "text-amber-100/80 hover:text-amber-100"
              }`}
            >
              {l === "kn" ? "ಕನ್ನಡ" : "English"}
            </button>
          ))}
        </span>
      </div>
      {!needsOther ? (
        panel
      ) : otherMessages ? (
        <NextIntlClientProvider locale={shareLocale} messages={otherMessages} timeZone="Asia/Kolkata">
          {panel}
        </NextIntlClientProvider>
      ) : (
        <p className="py-3 text-sm text-indigo-100/60">{t("preparing")}</p>
      )}
    </div>
  );
}

// Everything that's shared, worded in `locale` (rendered inside that
// language's messages when it isn't the page's own).
function SharePanel({ day, locale, siteUrl, deviceName, verse, honoured, acharyaMedia, labels }: Props & { labels: ShareLabels }) {
  const t = useTranslations("panchangam");
  const siteTitle = useTranslations("meta")("siteTitle");
  const text = useDayText(day, locale);
  // The place the times are worked out for: the visitor's town, or the temple's.
  const placeName = deviceName ?? label(TEMPLE_TOWN, locale);
  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const bareUrl = siteUrl.replace(/^https?:\/\//, "");
  // Plain text only: any web address makes WhatsApp show a link-preview card
  // instead of the message.
  const whatsappText = text.message(siteTitle, placeName, verse);

  return (
    <ShareActions
      card={
        <ShareCard
          day={day}
          locale={locale}
          siteTitle={siteTitle}
          siteUrl={bareUrl}
          placeName={placeName}
          verse={verse}
          acharyas={honoured.map((a) => ({ acharya: a, imageUrl: mediaFor(a, acharyaMedia).imageUrl, link: `${bareUrl}${localePrefix}${acharyaPath(a.slug)}` }))}
        />
      }
      fileBase={`panchangam-${day.date}${locale === "kn" ? "-kn" : ""}`}
      shareTitle={t("shareText", { date: text.longDate })}
      whatsappText={whatsappText}
      labels={labels}
    />
  );
}

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Notice } from "@/lib/content-types";
import { formatIso } from "@/lib/dates";
import ShareButton from "@/components/ShareButton";

const kindStyles: Record<Notice["kind"], string> = {
  update: "bg-gold/25 text-maroon-dark",
  ticket_release: "bg-maroon text-cream",
  event_reminder: "bg-saffron/20 text-maroon-dark",
  alert: "bg-red-600 text-white",
};

export default function NoticeCard({ notice, compact }: { notice: Notice; compact?: boolean }) {
  const t = useTranslations("notices");
  const locale = useLocale() as Locale;
  const title = notice.title[locale] || notice.title.en;
  const body = notice.body[locale] || notice.body.en;
  const ctaClass =
    "mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-maroon px-4 py-1.5 text-xs font-semibold text-cream hover:bg-maroon-dark";

  return (
    <article
      id={`notice-${notice.id}`}
      className={`relative scroll-mt-24 rounded-2xl border bg-white/75 p-5 ${
        notice.isPinned ? "border-maroon/40 shadow-sm" : "border-gold/25"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
        <span className={`rounded-full px-2.5 py-0.5 ${kindStyles[notice.kind]}`}>{t(`kinds.${notice.kind}`)}</span>
        {notice.isPinned ? <span className="text-maroon">{t("pinned")}</span> : null}
        <time dateTime={notice.publishOn} className="ml-auto font-medium normal-case tracking-normal text-ink/50">
          {formatIso(notice.publishOn, locale, { day: "numeric", month: "short", year: "numeric" })}
        </time>
        <ShareButton compact title={title} text={body} path={`/notices#notice-${notice.id}`} />
      </div>
      <h3 className="mt-2.5 font-display text-lg leading-snug text-maroon">{title}</h3>
      <p className={`mt-1.5 whitespace-pre-line text-sm text-ink/75 ${compact ? "line-clamp-3" : ""}`}>{body}</p>
      {notice.linkUrl ? (
        notice.linkUrl.startsWith("/") ? (
          <Link href={notice.linkUrl} className={ctaClass}>
            {t("cta")} →
          </Link>
        ) : (
          <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer" className={ctaClass}>
            {t("cta")} ↗
          </a>
        )
      ) : null}
    </article>
  );
}

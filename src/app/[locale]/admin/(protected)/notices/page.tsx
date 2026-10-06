import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { getNoticesForAdmin } from "@/lib/data/notices";
import { deleteNotice, setNoticePinned } from "@/lib/actions/notices";
import { todayInIndia, formatIso } from "@/lib/dates";
import type { Locale } from "@/i18n/routing";
import type { Notice } from "@/lib/content-types";

export default async function AdminNoticesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const notices = await getNoticesForAdmin();
  return <Content notices={notices} today={todayInIndia()} />;
}

function status(notice: Notice, today: string) {
  if (notice.publishOn > today) return { label: "Scheduled", className: "bg-blue-600/10 text-blue-700" };
  if (notice.expiresOn && notice.expiresOn < today) return { label: "Expired", className: "bg-black/5 text-ink/50" };
  return { label: "Live", className: "bg-gold/20 text-maroon" };
}

function Content({ notices, today }: { notices: Notice[]; today: string }) {
  const t = useTranslations("admin");
  const tKinds = useTranslations("notices.kinds");
  const locale = useLocale() as Locale;
  const fmt = (iso: string) => formatIso(iso, "en", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <AdminPageHeader
        title={t("nav.notices")}
        action={
          <Link
            href="/admin/notices/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105"
          >
            + Post notice
          </Link>
        }
      />
      {notices.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">
          No notices yet. Post updates, ticket releases and event reminders here.
        </p>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const s = status(notice, today);
            return (
              <div key={notice.id} className="rounded-2xl border border-ink/10 bg-black/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {notice.isPinned ? <span className="rounded-full bg-maroon px-2 py-0.5 text-cream">Pinned</span> : null}
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-ink/70">{tKinds(notice.kind)}</span>
                  <span className={`rounded-full px-2 py-0.5 ${s.className}`}>{s.label}</span>
                  <span className="text-ink/45">
                    {fmt(notice.publishOn)}
                    {notice.expiresOn ? ` → ${fmt(notice.expiresOn)}` : ""}
                  </span>
                </div>
                <p className="mt-2 font-medium text-ink">{notice.title[locale]}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/65">{notice.body[locale]}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <Link href={`/admin/notices/${notice.id}/edit`} className="text-xs font-semibold text-maroon hover:underline">
                    {t("actions.edit")}
                  </Link>
                  <form action={setNoticePinned.bind(null, notice.id, !notice.isPinned)}>
                    <button className="text-xs font-semibold text-maroon hover:underline">
                      {notice.isPinned ? "Unpin" : "Pin"}
                    </button>
                  </form>
                  <form action={deleteNotice.bind(null, notice.id)}>
                    <ConfirmSubmitButton message={`Delete "${notice.title.en}"?`}>Delete</ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

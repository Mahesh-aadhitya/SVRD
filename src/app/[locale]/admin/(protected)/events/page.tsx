import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderManager from "@/components/admin/FolderManager";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree, folderPath, type Folder } from "@/lib/folders";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";
import { postEventReminder } from "@/lib/actions/notices";
import { todayInIndia } from "@/lib/dates";
import { deleteEvent } from "@/lib/actions/events";
import { getEvents } from "@/lib/data/events";
import type { Locale } from "@/i18n/routing";
import type { TempleEvent } from "@/lib/content-types";

export default async function AdminEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [events, folders] = await Promise.all([getEvents(), getFolders("events")]);
  return <Content events={events} folders={folders} />;
}

function Content({ events, folders }: { events: TempleEvent[]; folders: Folder[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const today = todayInIndia();

  return (
    <div className="space-y-10">
      <div>
        <AdminPageHeader
          title={t("nav.events")}
          action={
            <Link
              href="/admin/events/new"
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105"
            >
              + {t("actions.add")}
            </Link>
          }
        />
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">{t("actions.edit")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-ink/10">
                  <td className="px-4 py-3 font-medium text-ink">{event.title[locale]}</td>
                  <td className="px-4 py-3 text-ink/60">{folderPath(folders, event.folderId) ?? "—"}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {new Date(event.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-xs font-semibold text-maroon hover:underline"
                      >
                        {t("actions.edit")}
                      </Link>
                      {event.date >= today ? (
                        <form action={postEventReminder.bind(null, event.id, locale)}>
                          <button className="text-xs font-semibold text-maroon hover:underline">Post reminder</button>
                        </form>
                      ) : null}
                      <form action={deleteEvent.bind(null, event.id, locale)}>
                        <ConfirmSubmitButton message={`Delete "${event.title.en}"? This cannot be undone.`}>
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <FolderManager section="events" basePath="/admin/events" tree={buildFolderTree(folders)} locale={locale} />
    </div>
  );
}

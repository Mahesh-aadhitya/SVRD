import { useTranslations, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/ui/Card";
import ContentImage from "@/components/ContentImage";
import ShareButton from "@/components/ShareButton";
import CategoryLinks from "@/components/CategoryLinks";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree, filterByFolder, selectedFolderIds, type FolderTree } from "@/lib/folders";
import { getEvents } from "@/lib/data/events";
import type { Locale } from "@/i18n/routing";
import type { TempleEvent } from "@/lib/content-types";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string; sub?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ cat, sub }, events, folders] = await Promise.all([searchParams, getEvents(), getFolders("events")]);
  const tree = buildFolderTree(folders);
  return (
    <EventsContent
      events={filterByFolder(events, selectedFolderIds(tree, cat, sub))}
      tree={tree}
      categoryId={cat}
      subfolderId={sub}
    />
  );
}

function EventsContent({
  events,
  tree,
  categoryId,
  subfolderId,
}: {
  events: TempleEvent[];
  tree: FolderTree;
  categoryId?: string;
  subfolderId?: string;
}) {
  const t = useTranslations("events");
  const locale = useLocale() as Locale;
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const dateLocale = locale === "kn" ? "kn-IN" : "en-IN";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <CategoryLinks
        pathname="/events"
        tree={tree}
        categoryId={categoryId}
        subfolderId={subfolderId}
        allLabel={t("filterAll")}
      />
      {sorted.length === 0 ? <p className="mt-8 text-center text-sm text-ink/55">{t("empty")}</p> : null}
      <div className="mt-8 space-y-4">
        {sorted.map((event) => {
          const date = new Date(`${event.date}T00:00:00`);
          return (
            <Card key={event.id} id={`event-${event.id}`} className="relative flex scroll-mt-24 flex-col gap-4 overflow-hidden sm:flex-row">
              <ShareButton
                compact
                title={event.title[locale]}
                text={`${date.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}\n${event.description[locale]}`}
                path={`/events#event-${event.id}`}
                imageUrl={event.image ?? undefined}
                className="absolute right-3 top-3 z-10"
              />
              <div className="relative h-40 w-full sm:h-auto sm:w-56 sm:shrink-0">
                <ContentImage src={event.image} alt={event.title[locale]} sizes="(min-width: 640px) 224px, 100vw" />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 p-5 sm:pl-0">
                <div className="flex items-center gap-3">
                  <div className="flex w-14 flex-col items-center rounded-lg bg-maroon text-cream">
                    <span className="pt-1.5 text-[10px] font-semibold uppercase tracking-wide">
                      {date.toLocaleDateString(dateLocale, { month: "short" })}
                    </span>
                    <span className="pb-1.5 font-display text-xl leading-none">
                      {date.getDate()}
                    </span>
                  </div>
                  <p className="font-display text-xl text-maroon">{event.title[locale]}</p>
                </div>
                <p className="text-sm text-ink/70">{event.description[locale]}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

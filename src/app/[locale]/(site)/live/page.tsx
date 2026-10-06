import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { connection } from "next/server";
import LiveComments from "@/components/LiveComments";
import LiveArchiveGrid from "@/components/LiveArchiveGrid";
import { getApprovedComments, LIVE_COMMENT_CONTEXT } from "@/lib/data/comments";
import { getFolders } from "@/lib/data/folders";
import type { Folder } from "@/lib/folders";
import type { PublicComment } from "@/lib/content-types";
import { getLiveConfig, getLiveArchive } from "@/lib/data/live";
import type { LiveConfig, LiveArchiveItem } from "@/lib/data/live";

export default async function LivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Rendered per request so the comment feed is current on first paint.
  await connection();
  const [config, archive, comments, folders] = await Promise.all([
    getLiveConfig(),
    getLiveArchive(),
    getApprovedComments(LIVE_COMMENT_CONTEXT),
    getFolders("live"),
  ]);
  return <LiveContent config={config} archive={archive} comments={comments} folders={folders} />;
}

function LiveContent({
  config,
  archive,
  comments,
  folders,
}: {
  config: LiveConfig;
  archive: LiveArchiveItem[];
  comments: PublicComment[];
  folders: Folder[];
}) {
  const t = useTranslations("live");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <div className="mt-6 overflow-hidden rounded-2xl bg-black shadow-lg">
        {config.isLive && config.platform === "youtube" && config.youtubeVideoId ? (
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${config.youtubeVideoId}?autoplay=1`}
              title="Live darshan"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : config.isLive && config.platform === "instagram" && config.instagramUrl ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-divine-gradient px-6 text-center text-cream">
            <Image src="/images/chakra-disc.png" alt="" width={56} height={56} className="opacity-90" />
            <p className="font-display text-xl">{t("pageTitle")}</p>
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-cream px-5 py-2.5 text-sm font-semibold text-maroon hover:brightness-105"
            >
              {t("instagramCta")}
            </a>
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-divine-gradient px-6 text-center text-cream">
            <Image src="/images/chakra-disc.png" alt="" width={56} height={56} className="opacity-90" />
            <p className="font-display text-xl">{t("offlineTitle")}</p>
            <p className="max-w-sm text-sm text-cream/75">{t("offlineSubtitle")}</p>
            {config.scheduledAt ? (
              <p className="mt-2 rounded-full bg-cream/10 px-4 py-1.5 text-xs font-medium text-gold-light">
                {t("scheduledLabel")}: {config.scheduledAt}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-8">
        <p className="font-display text-lg text-maroon">{t("commentsTitle")}</p>
        <LiveComments initial={comments} />
      </div>

      {archive.length > 0 ? (
        <div className="mt-10">
          <p className="font-display text-lg text-maroon">{t("archiveTitle")}</p>
          <LiveArchiveGrid items={archive} folders={folders} />
        </div>
      ) : null}
    </div>
  );
}

import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderManager from "@/components/admin/FolderManager";
import { getFolders } from "@/lib/data/folders";
import { buildFolderTree, type Folder } from "@/lib/folders";
import LiveControlPanel from "@/components/admin/LiveControlPanel";
import LiveArchiveManager from "@/components/admin/LiveArchiveManager";
import { getLiveConfig, getLiveArchive } from "@/lib/data/live";
import type { LiveConfig, LiveArchiveItem } from "@/lib/data/live";

export default async function AdminLivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [config, archive, folders] = await Promise.all([getLiveConfig(), getLiveArchive(), getFolders("live")]);
  return <Content config={config} archive={archive} folders={folders} />;
}

function Content({
  config,
  archive,
  folders,
}: {
  config: LiveConfig;
  archive: LiveArchiveItem[];
  folders: Folder[];
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const tree = buildFolderTree(folders);

  return (
    <div className="space-y-10">
      <div>
        <AdminPageHeader title={t("nav.live")} />
        <LiveControlPanel config={config} />
      </div>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Past darshans</h2>
        <LiveArchiveManager items={archive} folders={folders} />
      </section>
      <FolderManager section="live" basePath="/admin/live" tree={tree} locale={locale} />
    </div>
  );
}

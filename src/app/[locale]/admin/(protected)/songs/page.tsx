import { setRequestLocale } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderManager from "@/components/admin/FolderManager";
import SongManager from "@/components/admin/SongManager";
import { getSongs, getSongFolders } from "@/lib/data/songs";
import { buildFolderTree } from "@/lib/folders";
import type { Locale } from "@/i18n/routing";
import type { Song } from "@/lib/song-types";
import type { Folder } from "@/lib/folders";
import SongUploadForm from "./SongUploadForm";
import BackgroundSongForm from "@/components/admin/BackgroundSongForm";
import { fetchSiteSettings } from "@/lib/data/site-settings";
import type { SiteSettings } from "@/lib/content-types";

export default async function AdminSongsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [songs, folders, settings] = await Promise.all([getSongs(), getSongFolders(), fetchSiteSettings()]);
  return <Content songs={songs} folders={folders} settings={settings} />;
}

function Content({ songs, folders, settings }: { songs: Song[]; folders: Folder[]; settings: SiteSettings }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const tree = buildFolderTree(folders);

  return (
    <div className="space-y-10">
      <AdminPageHeader title={t("nav.songs")} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Background song</h2>
        <BackgroundSongForm current={settings.backgroundAudioUrl} currentTitle={settings.backgroundAudioTitle} songs={songs} />
      </section>

      <FolderManager section="songs" basePath="/admin/songs" tree={tree} locale={locale} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Upload</h2>
        <SongUploadForm categories={tree} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Tracks ({songs.length})</h2>
        <SongManager songs={songs} folders={folders} locale={locale} />
      </section>
    </div>
  );
}

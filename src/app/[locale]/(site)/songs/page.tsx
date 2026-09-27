import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import SongList from "@/components/SongList";
import { getSongs, getSongFolders } from "@/lib/data/songs";
import type { Song } from "@/lib/song-types";
import type { Folder } from "@/lib/folders";

export default async function SongsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [songs, folders] = await Promise.all([getSongs(), getSongFolders()]);
  return <SongsContent songs={songs} folders={folders} />;
}

function SongsContent({ songs, folders }: { songs: Song[]; folders: Folder[] }) {
  const t = useTranslations("songs");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <SongList songs={songs} folders={folders} />
    </div>
  );
}

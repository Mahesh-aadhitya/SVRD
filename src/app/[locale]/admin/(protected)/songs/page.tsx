import { setRequestLocale } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderForm from "@/components/admin/FolderForm";
import FolderTree from "@/components/admin/FolderTree";
import { getSongs, getSongFolders } from "@/lib/data/songs";
import { deleteSong } from "@/lib/actions/songs";
import { createFolder, deleteFolder } from "@/lib/actions/folders";
import { buildFolderTree } from "@/lib/folders";
import type { Locale } from "@/i18n/routing";
import type { Song } from "@/lib/song-types";
import type { Folder } from "@/lib/folders";
import SongUploadForm from "./SongUploadForm";

const SECTION = "songs" as const;
const BASE_PATH = "/admin/songs";

export default async function AdminSongsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [songs, folders] = await Promise.all([getSongs(), getSongFolders()]);
  return <Content songs={songs} folders={folders} />;
}

function Content({ songs, folders }: { songs: Song[]; folders: Folder[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const tree = buildFolderTree(folders);
  const folderName = (id: string) => folders.find((f) => f.id === id)?.name ?? "—";

  return (
    <div className="space-y-10">
      <AdminPageHeader title={t("nav.songs")} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Folders
        </h2>
        <div className="mb-4 rounded-2xl border border-ink/10 p-4">
          <FolderTree
            tree={tree}
            onDelete={(id) => deleteFolder.bind(null, SECTION, BASE_PATH, id, locale)}
          />
        </div>
        <FolderForm categories={tree} action={createFolder.bind(null, SECTION, BASE_PATH, locale)} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Upload
        </h2>
        <SongUploadForm categories={tree} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Tracks
        </h2>
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Folder</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id} className="border-t border-ink/10">
                  <td className="px-4 py-3 font-medium text-ink">{song.title[locale]}</td>
                  <td className="px-4 py-3 text-ink/70">{folderName(song.folderId)}</td>
                  <td className="px-4 py-3 text-ink/70">{song.duration}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteSong.bind(null, song.id, locale)}>
                      <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderForm from "@/components/admin/FolderForm";
import FolderTree from "@/components/admin/FolderTree";
import { getGalleryItems, getGalleryFolders } from "@/lib/data/gallery";
import { deleteGalleryItem } from "@/lib/actions/gallery";
import { createFolder, deleteFolder } from "@/lib/actions/folders";
import { buildFolderTree } from "@/lib/folders";
import type { Locale } from "@/i18n/routing";
import type { GalleryItem } from "@/lib/gallery-types";
import type { Folder } from "@/lib/folders";
import GalleryUploadForm from "./GalleryUploadForm";

const SECTION = "gallery" as const;
const BASE_PATH = "/admin/gallery";

export default async function AdminGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [items, folders] = await Promise.all([getGalleryItems(), getGalleryFolders()]);
  return <Content items={items} folders={folders} />;
}

function Content({ items, folders }: { items: GalleryItem[]; folders: Folder[] }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const tree = buildFolderTree(folders);
  const folderName = (id: string) => folders.find((f) => f.id === id)?.name ?? "—";

  return (
    <div className="space-y-10">
      <AdminPageHeader title={t("nav.gallery")} />

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
        <GalleryUploadForm categories={tree} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Items
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-ink/10">
              <div className="relative aspect-square w-full">
                <Image src={item.image} alt="" fill className="object-cover" />
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="truncate text-ink/60">{folderName(item.folderId)}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-maroon">
                    {item.type}
                  </span>
                  <form action={deleteGalleryItem.bind(null, item.id, locale)}>
                    <button type="submit" className="text-red-600 hover:underline">
                      ×
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

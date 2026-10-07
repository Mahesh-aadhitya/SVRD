import { setRequestLocale } from "next-intl/server";
import { useTranslations, useLocale } from "next-intl";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FolderManager from "@/components/admin/FolderManager";
import GalleryManager from "@/components/admin/GalleryManager";
import { getGalleryItems, getGalleryFolders } from "@/lib/data/gallery";
import { buildFolderTree } from "@/lib/folders";
import type { Locale } from "@/i18n/routing";
import type { GalleryItem } from "@/lib/gallery-types";
import type { Folder } from "@/lib/folders";
import GalleryUploadForm from "./GalleryUploadForm";

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

  return (
    <div className="space-y-10">
      <AdminPageHeader title={t("nav.gallery")} />

      <FolderManager section="gallery" basePath="/admin/gallery" tree={tree} locale={locale} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Upload</h2>
        <GalleryUploadForm categories={tree} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Items ({items.length})</h2>
        <GalleryManager items={items} folders={folders} />
      </section>
    </div>
  );
}

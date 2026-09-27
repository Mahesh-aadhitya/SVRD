import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import GalleryGrid from "@/components/GalleryGrid";
import { getGalleryItems, getGalleryFolders } from "@/lib/data/gallery";
import type { GalleryItem } from "@/lib/gallery-types";
import type { Folder } from "@/lib/folders";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [items, folders] = await Promise.all([getGalleryItems(), getGalleryFolders()]);
  return <GalleryContent items={items} folders={folders} />;
}

function GalleryContent({ items, folders }: { items: GalleryItem[]; folders: Folder[] }) {
  const t = useTranslations("gallery");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <GalleryGrid items={items} folders={folders} />
    </div>
  );
}

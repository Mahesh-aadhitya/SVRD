"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { LiveArchiveItem } from "@/lib/data/live";
import { youtubeThumbnail } from "@/lib/youtube";
import Card from "@/components/ui/Card";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import { buildFolderTree, filterByFolder, selectedFolderIds, type Folder } from "@/lib/folders";

export default function LiveArchiveGrid({ items, folders }: { items: LiveArchiveItem[]; folders: Folder[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("gallery");
  const [playing, setPlaying] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subfolderId, setSubfolderId] = useState<string | null>(null);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const visible = filterByFolder(items, selectedFolderIds(tree, categoryId, subfolderId));

  return (
    <>
      <CategoryFilterBar
        tree={tree}
        categoryId={categoryId}
        subfolderId={subfolderId}
        onChange={(cat, sub) => {
          setCategoryId(cat);
          setSubfolderId(sub);
        }}
        allLabel={t("filterAll")}
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative aspect-video w-full bg-black">
              {playing === item.id ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1`}
                  title={item.title[locale]}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(item.id)} className="group absolute inset-0">
                  <Image
                    src={youtubeThumbnail(item.youtubeId)}
                    alt={item.title[locale]}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-85 transition-opacity group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-0.5 fill-maroon">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </button>
              )}
            </div>
            <p className="p-3 text-sm font-medium text-ink/80">{item.title[locale]}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { GalleryItem } from "@/lib/gallery-types";
import { buildFolderTree, filterByFolder, selectedFolderIds, type Folder } from "@/lib/folders";
import Chip, { ChipRow } from "@/components/ui/Chip";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import ShareButton from "@/components/ShareButton";

type TypeFilter = "all" | "photo" | "video";

export default function GalleryGrid({
  items,
  folders,
}: {
  items: GalleryItem[];
  folders: Folder[];
}) {
  const t = useTranslations("gallery");
  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subfolderId, setSubfolderId] = useState<string | null>(null);
  // Open on photos (videos are a tap away), unless there are none.
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() => (items.some((i) => i.type === "photo") ? "photo" : "all"));
  const [active, setActive] = useState<GalleryItem | null>(null);

  const shareTitle = (item: GalleryItem) => (item.type === "video" ? t("shareVideo") : t("sharePhoto"));

  // A shared link (?item=…) opens that photo or video.
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get("item");
    const item = id ? items.find((i) => i.id === id) : undefined;
    if (item) setActive(item); // eslint-disable-line react-hooks/set-state-in-effect
  }, [items]);

  const ofType = items.filter((item) => typeFilter === "all" || item.type === typeFilter);
  const filtered = filterByFolder(ofType, selectedFolderIds(tree, categoryId, subfolderId));

  return (
    <div className="mt-6">
      <CategoryFilterBar
        className=""
        tree={tree}
        categoryId={categoryId}
        subfolderId={subfolderId}
        onChange={(cat, sub) => {
          setCategoryId(cat);
          setSubfolderId(sub);
        }}
        allLabel={t("filterAll")}
        count={(ids) => filterByFolder(ofType, ids).length}
      />

      <ChipRow className="mt-3">
        {(
          [
            ["photo", t("filterPhotos")],
            ["video", t("filterVideos")],
            ["all", t("filterAll")],
          ] as const
        ).map(([value, label]) => (
          <Chip key={value} small active={typeFilter === value} onClick={() => setTypeFilter(value)}>
            {label}
          </Chip>
        ))}
      </ChipRow>

      {filtered.length === 0 ? <p className="mt-6 text-center text-sm text-ink/55">{t("empty")}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <div key={item.id} className="relative">
          <button
            type="button"
            onClick={() => setActive(item)}
            className="group relative block aspect-square w-full overflow-hidden rounded-xl"
          >
            <Image
              src={item.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {item.type === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-0.5 fill-maroon">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            ) : null}
          </button>
          <ShareButton
            compact
            title={shareTitle(item)}
            path={`/gallery?item=${item.id}`}
            imageUrl={item.type === "photo" ? item.image : undefined}
            className="absolute right-1.5 top-1.5"
          />
          </div>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end gap-2 bg-black/60 px-3 py-2">
              <ShareButton
                tone="dark"
                title={shareTitle(active)}
                path={`/gallery?item=${active.id}`}
                imageUrl={active.type === "photo" ? active.image : undefined}
              />
              <button type="button" onClick={() => setActive(null)} className="rounded-full px-3 text-lg text-white/70 hover:text-white" aria-label="Close">
                ×
              </button>
            </div>
            {active.type === "video" && active.youtubeId ? (
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}`}
                  title="Temple video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full">
                <Image src={active.image} alt="" fill className="object-contain" />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}


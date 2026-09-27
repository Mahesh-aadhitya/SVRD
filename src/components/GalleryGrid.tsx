"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { gallery, type GalleryItem } from "@/lib/placeholder-data";

type Filter = "all" | "photo" | "video";

export default function GalleryGrid() {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<GalleryItem | null>(null);

  const filtered = gallery.filter((item) => filter === "all" || item.type === filter);

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        {(
          [
            ["all", t("filterAll")],
            ["photo", t("filterPhotos")],
            ["video", t("filterVideos")],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === value
                ? "border-maroon bg-maroon text-cream"
                : "border-gold/40 text-ink/70 hover:border-maroon/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            <Image
              src={item.image}
              alt=""
              fill
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

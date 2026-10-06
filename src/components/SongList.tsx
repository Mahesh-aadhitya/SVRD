"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { Song } from "@/lib/song-types";
import type { Folder } from "@/lib/folders";
import { buildFolderTree } from "@/lib/folders";
import Chip from "@/components/ui/Chip";

export default function SongList({ songs, folders }: { songs: Song[]; folders: Folder[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("songs");
  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [subfolderId, setSubfolderId] = useState<string | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedCategory = tree.find((c) => c.id === categoryId);
  const filtered = songs.filter((song) => {
    if (categoryId === "all") return true;
    if (subfolderId !== "all") return song.folderId === subfolderId;
    const folderIds = [categoryId, ...(selectedCategory?.subfolders.map((s) => s.id) ?? [])];
    return folderIds.includes(song.folderId);
  });

  return (
    <div>
      {tree.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={categoryId === "all"} onClick={() => { setCategoryId("all"); setSubfolderId("all"); }}>
            {t("filterAll")}
          </Chip>
          {tree.map((category) => (
            <Chip
              key={category.id}
              active={categoryId === category.id}
              onClick={() => { setCategoryId(category.id); setSubfolderId("all"); }}
            >
              {category.name}
            </Chip>
          ))}
        </div>
      ) : null}

      {selectedCategory && selectedCategory.subfolders.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip active={subfolderId === "all"} onClick={() => setSubfolderId("all")} small>
            All
          </Chip>
          {selectedCategory.subfolders.map((sub) => (
            <Chip key={sub.id} active={subfolderId === sub.id} onClick={() => setSubfolderId(sub.id)} small>
              {sub.name}
            </Chip>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink/55">{t("empty")}</p>
      ) : null}
      <div className={`mt-6 overflow-hidden rounded-2xl border border-gold/25 bg-white/70 ${filtered.length === 0 ? "hidden" : ""}`}>
        {filtered.map((song, index) => {
          const isActive = activeId === song.id;
          return (
            <div key={song.id}>
              <button
                type="button"
                onClick={() => setActiveId(isActive ? null : song.id)}
                className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${
                  index !== 0 ? "border-t border-gold/15" : ""
                } ${isActive ? "bg-cream-dark" : "hover:bg-cream-dark/60"}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isActive ? "bg-maroon text-cream" : "bg-maroon/10 text-maroon"
                  }`}
                >
                  {isActive ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-0.5 fill-current">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base text-ink">
                    {song.title[locale]}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink/50">{song.duration}</span>
              </button>
              {isActive && song.audioUrl ? (
                <div className="border-t border-gold/15 bg-cream-dark px-4 py-3">
                  {/* preload="none": nothing downloads until the visitor
                      presses play, and only the expanded track is ever
                      mounted — so browsing a long song list never fetches
                      audio it doesn't need. Native <audio> streams the
                      file via HTTP range requests once played, so it
                      starts instantly instead of waiting on a full
                      download. */}
                  <audio key={song.id} src={song.audioUrl} controls autoPlay preload="none" className="w-full" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

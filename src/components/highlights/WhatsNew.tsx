"use client";

import { useTranslations } from "next-intl";
import HighlightTile from "./HighlightTile";
import { openNotifications, useHighlights, useSeenHighlights } from "./useHighlights";
import type { Highlight } from "@/lib/highlight-types";

// Home page "What's new": a notification board of tiles — live darshan,
// ticket releases, messages from the temple and coming festivals — that
// updates itself as admins add things.
export default function WhatsNew({ initial }: { initial: Highlight[] }) {
  const t = useTranslations("highlights");
  const items = useHighlights(initial).slice(0, 6);
  const seen = useSeenHighlights();
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6" aria-labelledby="whats-new">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="whats-new" className="font-display text-2xl text-maroon">{t("title")}</h2>
        <button type="button" onClick={openNotifications} className="text-sm font-semibold text-maroon hover:underline">
          {t("viewAll")} →
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((h) => (
          <HighlightTile key={h.id} item={h} unseen={!!seen && h.isNew && h.kind !== "live" && !seen.has(h.id)} />
        ))}
      </div>
    </section>
  );
}

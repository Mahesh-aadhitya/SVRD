"use client";

import { useActionState, useState } from "react";
import { updateLiveConfig } from "@/lib/actions/live";
import type { LiveConfig } from "@/lib/data/live";

export default function LiveControlPanel({ config }: { config: LiveConfig }) {
  const [state, formAction, pending] = useActionState(updateLiveConfig, undefined);
  const [platform, setPlatform] = useState<"youtube" | "instagram">(config.platform);
  const [isLive, setIsLive] = useState(config.isLive);

  return (
    <form action={formAction} className="max-w-xl rounded-2xl border border-ink/10 bg-black/[0.03] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-ink">Live status</p>
          <p className="text-xs text-ink/50">Toggle this on right before the stream starts.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsLive((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            isLive ? "bg-gold" : "bg-black/10"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              isLive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <input type="hidden" name="isLive" value={isLive ? "on" : "off"} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink/70">Platform</p>
        <div className="mt-1.5 flex gap-4 text-sm">
          {(["youtube", "instagram"] as const).map((value) => (
            <label key={value} className="flex items-center gap-1.5 text-ink/80">
              <input
                type="radio"
                name="platform"
                value={value}
                checked={platform === value}
                onChange={() => setPlatform(value)}
              />
              {value === "youtube" ? "YouTube" : "Instagram"}
            </label>
          ))}
        </div>
      </div>

      {platform === "youtube" ? (
        <div className="mt-4">
          <label className="text-sm font-medium text-ink/70" htmlFor="yt">
            YouTube video / live link
          </label>
          <input
            id="yt"
            name="youtubeVideoId"
            defaultValue={config.youtubeVideoId ?? ""}
            placeholder="Paste the ID or the full YouTube link"
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold"
          />
          <p className="mt-1.5 text-xs text-ink/45">
            You can paste just the video ID, or the whole link from YouTube Live studio/share button (watch, youtu.be,
            or /live links all work) — we extract the ID automatically.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <label className="text-sm font-medium text-ink/70" htmlFor="ig">
            Instagram profile / live URL
          </label>
          <input
            id="ig"
            name="instagramUrl"
            type="url"
            defaultValue={config.instagramUrl ?? ""}
            placeholder="https://instagram.com/yourtemple"
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold"
          />
          <p className="mt-1.5 text-xs text-ink/45">
            Instagram has no public embed API — devotees see a &ldquo;Watch on Instagram&rdquo; link that opens
            this URL, not an in-page video.
          </p>
        </div>
      )}

      <div className="mt-4">
        <label className="text-sm font-medium text-ink/70" htmlFor="scheduledAt">
          Next scheduled darshan (shown while offline)
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          defaultValue={config.scheduledAt ?? ""}
          placeholder="e.g. Tomorrow, 6:00 AM IST"
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold"
        />
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="mt-4 rounded-xl bg-gold/15 px-3 py-2 text-xs text-maroon">Saved.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>

      <p
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
          isLive ? "bg-gold/20 text-maroon" : "bg-black/5 text-ink/50"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-maroon" : "bg-ink/30"}`} />
        {isLive ? "Currently live" : "Currently offline"}
      </p>
    </form>
  );
}

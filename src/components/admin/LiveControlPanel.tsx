"use client";

import { useState } from "react";
import { liveConfig } from "@/lib/placeholder-data";

export default function LiveControlPanel() {
  const [isLive, setIsLive] = useState(liveConfig.isLive);
  const [youtubeId, setYoutubeId] = useState(liveConfig.youtubeId);

  return (
    <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-cream">Live status</p>
          <p className="text-xs text-cream/50">Toggle this on right before the stream starts.</p>
        </div>
        <button
          onClick={() => setIsLive((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            isLive ? "bg-gold" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              isLive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium text-cream/70" htmlFor="yt">
          YouTube video / live ID
        </label>
        <input
          id="yt"
          value={youtubeId}
          onChange={(e) => setYoutubeId(e.target.value)}
          placeholder="e.g. dQw4w9WgXcQ"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-gold"
        />
        <p className="mt-1.5 text-xs text-cream/45">
          Paste the ID from your YouTube Live studio — the devotee-facing Live page embeds it automatically.
        </p>
      </div>

      <button className="mt-6 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105">
        Save
      </button>

      <p
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
          isLive ? "bg-gold/20 text-gold-light" : "bg-white/10 text-cream/50"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-gold-light" : "bg-cream/40"}`} />
        {isLive ? "Currently live" : "Currently offline"}
      </p>
    </div>
  );
}

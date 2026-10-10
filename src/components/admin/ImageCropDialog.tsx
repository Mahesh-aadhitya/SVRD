"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";

// Longest side of the saved picture: plenty for cards and full-width
// headers, and a phone photo of several MB comes out a few hundred KB.
const MAX_SIDE = 1600;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't open this picture"));
    img.src = src;
  });
}

async function toJpeg(src: string, area: Area | null): Promise<File> {
  const img = await loadImage(src);
  const crop = area ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
  const scale = Math.min(1, MAX_SIDE / Math.max(crop.width, crop.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.width * scale);
  canvas.height = Math.round(crop.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the picture");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("Couldn't prepare the picture");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

// Crop a picture before it's uploaded: drag to place, zoom with the slider
// or a pinch, in the shape it will be shown in (`aspect`). "Use whole
// photo" skips cropping but still resizes. Either way the result is a JPEG
// handed to `onDone`.
export default function ImageCropDialog({
  src,
  aspect,
  shapeLabel,
  onDone,
  onCancel,
}: {
  src: string;
  aspect: number;
  shapeLabel: string;
  onDone: (file: File) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  // Fill the crop frame with the photo along its shorter side, so the frame
  // is as large as the window and the rest of the photo shows dimmed around it.
  const [fit, setFit] = useState<"horizontal-cover" | "vertical-cover">("horizontal-cover");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [busy, onCancel]);

  async function finish(whole: boolean) {
    setBusy(true);
    setError(null);
    try {
      onDone(await toJpeg(src, whole ? null : area));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't prepare the picture");
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Crop picture">
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-gold/30 px-5 py-3">
          <div>
            <p className="font-display text-xl text-maroon">Crop picture</p>
            <p className="text-xs text-ink/55">Drag to place the deity&apos;s face in view; zoom to fit. Shape: {shapeLabel}.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Cancel" className="rounded-full p-2 text-ink/50 hover:bg-black/5 hover:text-ink">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* A fixed height that never shrinks — Safari collapses a flexible
            one to nothing, since the cropper's contents are absolutely placed. */}
        <div className="relative h-[min(60vh,32rem)] min-h-[16rem] w-full bg-ink">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            showGrid
            objectFit={fit}
            onMediaLoaded={(m) => setFit(m.naturalWidth / m.naturalHeight < aspect ? "horizontal-cover" : "vertical-cover")}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="flex items-center gap-3 text-sm text-ink/70">
            <span className="w-12 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-maroon"
            />
          </label>
          {error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p> : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => finish(true)} disabled={busy} className="mr-auto text-xs font-semibold text-ink/55 hover:text-maroon hover:underline disabled:opacity-50">
              Use whole photo
            </button>
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:bg-black/[0.03]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              disabled={busy || !area}
              className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50"
            >
              {busy ? "Preparing…" : "Use this crop"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

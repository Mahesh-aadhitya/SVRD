"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import AcharyaPortrait from "./AcharyaPortrait";

/**
 * An Alwar's or Acharya's portrait that opens the whole picture, full
 * screen, when tapped. Often sits inside a card that links to their page, so
 * it's a span (not a button nested in a link) and stops the tap from also
 * following the link. Without a picture — or when it fails to load — it's
 * the plain portrait with the Chakra watermark, and doesn't open.
 */
export default function ZoomablePortrait({
  fullImageUrl,
  ...props
}: {
  name: string;
  imageUrl?: string | null;
  /** The whole picture for the full-screen view, when `imageUrl` is a smaller copy. */
  fullImageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const t = useTranslations("panchangam.acharya");
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState<string | null>(null);
  const imageUrl = props.imageUrl && props.imageUrl !== broken ? props.imageUrl : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
    };
  }, [open]);

  if (!imageUrl) return <AcharyaPortrait {...props} imageUrl={null} />;

  // Taps here must never reach a card link around the portrait — React
  // bubbles portal events up to it too.
  const show = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };
  const hide = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        aria-label={t("viewPicture", { name: props.name })}
        title={t("viewPicture", { name: props.name })}
        onClick={show}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && show(e)}
        className="inline-flex cursor-zoom-in rounded-full transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <AcharyaPortrait {...props} imageUrl={imageUrl} onImageError={() => setBroken(imageUrl)} />
      </span>
      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={props.name}
              onClick={hide}
              className="animate-divine-fade-up fixed inset-0 z-[90] flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-[#0b0503]/92 p-4 backdrop-blur-sm"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- any picture size, shown whole */}
              <img
                src={fullImageUrl || imageUrl}
                alt={props.name}
                className="max-h-[80vh] max-w-full rounded-2xl border-2 border-gold/70 object-contain shadow-[0_0_60px_rgba(255,190,90,0.35)]"
                style={{ maxHeight: "min(80vh, 80svh)" }}
              />
              <p className="max-w-xl text-center font-display text-lg text-gold-light">{props.name}</p>
              <button
                type="button"
                onClick={hide}
                aria-label={t("closePicture")}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl leading-none text-cream hover:bg-white/20"
                style={{ top: "max(1rem, env(safe-area-inset-top))" }}
              >
                ×
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

import type { CSSProperties } from "react";

// The site's loading indicator: the maroon line-art chakram (a small copy of
// the hero watermark), animated in globals.css (.chakra-loader).
export default function ChakraLoader({ size = 96, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="chakra-loader" style={{ "--chakra-size": `${size}px` } as CSSProperties}>
        <div className="chakra-loader__halo" aria-hidden />
        <div className="chakra-loader__emblem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/chakra-loader.png" alt="" width={268} height={320} />
          <div className="chakra-loader__shine" aria-hidden />
        </div>
      </div>
      <span className={label ? "text-sm font-medium text-maroon/80" : "sr-only"}>{label ?? "Loading…"}</span>
    </div>
  );
}

import Image from "next/image";

/**
 * Fixed, low-opacity chakra + shankha watermark shown behind page
 * content — Vishnu's two hand-held attributes, echoing the header
 * emblem without repeating it. Cropped from the temple's own ayudha
 * emblem photo (see CREDITS.md).
 */
export default function PageWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <Image
        src="/images/emblem-chakra.png"
        alt=""
        width={185}
        height={268}
        className="absolute -right-10 -top-8 h-[280px] w-auto opacity-[0.06]"
      />
      <Image
        src="/images/emblem-shankha.png"
        alt=""
        width={205}
        height={268}
        className="absolute -bottom-10 -left-10 h-[260px] w-auto opacity-[0.06]"
      />
    </div>
  );
}

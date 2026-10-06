import Image from "next/image";

/**
 * Fixed, very faint chakra (left) and shankha (right) behind page content
 * — Vishnu's two hand-held attributes in the same line-art as the hero,
 * placed whole in the side margins rather than cropped into corners.
 * Wide screens only: on phones the content fills the width and a
 * watermark would just sit behind the text.
 */
export default function PageWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden xl:block" aria-hidden>
      <Image
        src="/images/chakra-watermark.png"
        alt=""
        width={1200}
        height={1432}
        className="absolute left-[-3.5rem] top-1/2 h-[420px] w-auto -translate-y-1/2 opacity-[0.05]"
      />
      <Image
        src="/images/shankha-watermark.png"
        alt=""
        width={1200}
        height={1486}
        className="absolute right-[-3.5rem] top-1/2 h-[420px] w-auto -translate-y-1/2 opacity-[0.05]"
      />
    </div>
  );
}

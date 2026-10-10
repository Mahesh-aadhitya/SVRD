import Image from "next/image";

// Cover image for admin-managed content. When the admin hasn't uploaded one,
// shows the temple's Chakra watermark on sandalwood instead of a stock
// placeholder picture (or a flat block of colour).
//
// The photo fills its frame; `focus` ("51% 16%", where the AI found the
// deity's face) keeps the face in view when the frame crops a tall photo.
// Without it, the crop leans to the upper part, where faces usually are.
export default function ContentImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  focus,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  focus?: string | null;
}) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: focus || "50% 30%" }} />;

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fbf3df] via-[#f4e4bd] to-[#e6cb8f]" role="img" aria-label={alt}>
      <Image src="/images/chakra-watermark.png" alt="" width={1200} height={1432} className="h-3/4 w-auto opacity-40" />
    </div>
  );
}

import Image from "next/image";

// Cover image for admin-managed content. When the admin hasn't uploaded one,
// shows the temple's chakra emblem on the divine gradient instead of a stock
// placeholder picture.
export default function ContentImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src: string | null;
  alt: string;
  sizes?: string;
}) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;

  return (
    <div className="flex h-full w-full items-center justify-center bg-divine-gradient" role="img" aria-label={alt}>
      <Image src="/images/chakra-disc.png" alt="" width={56} height={56} className="opacity-80" />
    </div>
  );
}

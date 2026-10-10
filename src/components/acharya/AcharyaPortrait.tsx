/* eslint-disable @next/next/no-img-element -- plain <img> so the share card can capture it */

// A framed portrait of an Alwar or Acharya: the temple's picture when one
// has been added, otherwise the Chakra watermark on a sandalwood-gold medallion. Plain DOM and
// inline styles, so it renders the same on the page and in the share card.
export default function AcharyaPortrait({
  name,
  imageUrl,
  size = 96,
  className = "",
  onImageError,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
  /** Called when the picture fails to load (so the caller can fall back). */
  onImageError?: () => void;
}) {
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height: size * 1.2,
        borderRadius: size * 0.5,
        padding: Math.max(2, size * 0.035),
        background: "linear-gradient(160deg, #f6dc8f, #b8862f 55%, #f2cf74)",
        boxShadow: "0 0 24px rgba(255,190,90,0.35)",
      }}
    >
      <span
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.5,
          background: imageUrl ? "radial-gradient(circle at 50% 35%, #8a2a22, #4a1010 75%)" : "radial-gradient(circle at 50% 38%, #fff6e0, #f1dca6 60%, #dcb86a)",
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} crossOrigin="anonymous" onError={onImageError} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <img src="/images/chakra-watermark.png" alt={name} style={{ width: "74%", height: "auto", opacity: 0.55 }} />
        )}
      </span>
    </span>
  );
}

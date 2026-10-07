/* eslint-disable @next/next/no-img-element -- plain <img> so the share card can capture it */

// A framed portrait of an Alwar or Acharya: the temple's picture when one
// has been added, otherwise the Tirunamam on a gold medallion. Plain DOM and
// inline styles, so it renders the same on the page and in the share card.
export default function AcharyaPortrait({
  name,
  imageUrl,
  size = 96,
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
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
          background: "radial-gradient(circle at 50% 35%, #8a2a22, #4a1010 75%)",
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <img src="/images/emblem-naamam.png" alt={name} style={{ width: "62%", height: "auto", opacity: 0.95 }} />
        )}
      </span>
    </span>
  );
}

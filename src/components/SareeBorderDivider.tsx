/**
 * Ornate saree-border-style strip (floral vine + diamond bands),
 * provided by the temple — used under the navbar and, flipped
 * vertically, above the footer so the two bookend the page
 * symmetrically. Scrolls continuously to the right; the background tile
 * is fixed at 240px wide (matching the animation's keyframe distance)
 * so the loop is seamless regardless of the strip's display height.
 */
export default function SareeBorderDivider({
  flipped = false,
  className = "",
}: {
  flipped?: boolean;
  className?: string;
}) {
  return (
    <div
      role="presentation"
      className={`h-10 w-full overflow-hidden sm:h-12 ${className}`}
    >
      <div
        className="h-full w-full animate-border-scroll bg-repeat-x bg-center"
        style={{
          backgroundImage: `url(/images/saree-border${flipped ? "-flipped" : ""}.png)`,
          backgroundSize: "240px 61px",
        }}
      />
    </div>
  );
}

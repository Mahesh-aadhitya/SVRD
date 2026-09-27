import Image from "next/image";

/**
 * The chakra's circular disc (cropped from the temple's ayudha emblem
 * photo, see CREDITS.md) used as the loading indicator — only the
 * round disc spins, not the crown/drape/pedestal around it, since
 * those aren't part of the wheel itself.
 */
export default function ChakraSpinner({
  label,
  tone = "light",
}: {
  label?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
      <Image
        src="/images/emblem-chakra-disc.png"
        alt=""
        width={56}
        height={56}
        className="animate-chakra-spin rounded-full"
      />
      {label ? (
        <p className={`text-sm ${tone === "dark" ? "text-cream/60" : "text-ink/50"}`}>{label}</p>
      ) : null}
    </div>
  );
}

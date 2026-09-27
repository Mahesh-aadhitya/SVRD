export default function Chip({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border font-medium transition-colors ${
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        active
          ? "border-maroon bg-maroon text-cream"
          : "border-gold/40 text-ink/70 hover:border-maroon/50"
      }`}
    >
      {children}
    </button>
  );
}

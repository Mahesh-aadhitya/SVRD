export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gold/25 bg-white/70 shadow-[0_1px_2px_rgba(107,22,33,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(107,22,33,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

// Pill used by every filter row. Shared classes so link-based filters
// (CategoryLinks) look the same as button-based ones.
export function chipClass(active: boolean, small?: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors ${
    small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
  } ${active ? "border-maroon bg-maroon text-cream shadow-sm" : "border-gold/40 bg-white/70 text-ink/75 hover:border-maroon/50 hover:text-maroon"}`;
}

export function ChipCount({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`rounded-full px-1.5 text-[10px] font-semibold leading-4 ${active ? "bg-cream/20 text-cream" : "bg-maroon/10 text-maroon"}`}>
      {count}
    </span>
  );
}

export default function Chip({
  active,
  onClick,
  small,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  /** Items behind this filter, shown as a small badge. */
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={chipClass(active, small)}>
      {children}
      {count !== undefined ? <ChipCount count={count} active={active} /> : null}
    </button>
  );
}

// A row of chips: one swipeable line on phones, wrapping on wider screens.
export function ChipRow({ label, children, className = "" }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label ? <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-ink/45 sm:inline">{label}</span> : null}
      <div
        role="group"
        aria-label={label}
        className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

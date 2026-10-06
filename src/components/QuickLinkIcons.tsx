// Line icons for the home page quick-link tiles, drawn in the temple's
// maroon/gold palette so they match the site's emblem artwork instead of
// platform emoji (which render differently on every device).

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Diya (oil lamp) with flame — sevas.
export function DiyaIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 4c2.6 3 3.2 5.4 1.9 7.2a2.4 2.4 0 0 1-3.8 0C12.8 9.4 13.4 7 16 4Z" fill="currentColor" fillOpacity={0.18} />
      <path d="M4 17h24c-1 4.8-5.9 8-12 8S5 21.8 4 17Z" />
      <path d="M28 17c1.2-.6 2-1.6 2-2.8" />
      <path d="M11 28h10" />
      <path d="M16 13.5V17" />
    </svg>
  );
}

// Calendar with a festival mark — events.
export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="7" width="22" height="20" rx="3" />
      <path d="M5 13h22" />
      <path d="M11 4.5v5M21 4.5v5" />
      <path d="M16 16.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4Z" fill="currentColor" fillOpacity={0.18} />
    </svg>
  );
}

// Temple-arch frame holding a picture — gallery.
export function ArchFrameIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 28V14a10 10 0 0 1 20 0v14Z" />
      <path d="M16 4v-1.5" />
      <circle cx="16" cy="13" r="2.2" fill="currentColor" fillOpacity={0.18} />
      <path d="M9 25l4.5-5 3.5 3.5 2.5-2.5L23 25" />
      <path d="M4 28h24" />
    </svg>
  );
}

// Temple bell — devotional songs.
export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 3v3" />
      <circle cx="16" cy="7.5" r="1.5" />
      <path d="M10 22v-7a6 6 0 0 1 12 0v7" />
      <path d="M7 22h18l-1.5 3h-15Z" fill="currentColor" fillOpacity={0.18} />
      <path d="M16 25v2.5" />
      <circle cx="16" cy="29" r="1.2" fill="currentColor" />
    </svg>
  );
}

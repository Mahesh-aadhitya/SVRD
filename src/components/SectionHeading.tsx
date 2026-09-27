export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  cta,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-display text-2xl text-maroon sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-ink/70 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {cta ? <div className="shrink-0">{cta}</div> : null}
    </div>
  );
}

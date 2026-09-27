export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-black/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-2 font-display text-3xl text-maroon">{value}</p>
    </div>
  );
}

export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-cream/55">{label}</p>
      <p className="mt-2 font-display text-3xl text-gold-light">{value}</p>
    </div>
  );
}

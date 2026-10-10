import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SevaRequestCard from "@/components/admin/SevaRequestCard";
import { getSevaRequestsForAdmin } from "@/lib/data/seva-requests";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/seva-requests/types";

const TABS: { key: "open" | RequestStatus | "all"; label: string }[] = [
  { key: "open", label: "To follow up" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Called" },
  { key: "confirmed", label: "Confirmed" },
  { key: "done", label: "Done" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

// Devotees asking for a seva on a day of their choosing. The priest hears
// about each one on WhatsApp and email; here the office calls back and
// keeps track, soonest requested day first.
export default async function AdminSevaRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const [{ locale }, { show }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const tab = TABS.find((t) => t.key === show)?.key ?? "open";
  const { requests, counts } = await getSevaRequestsForAdmin(tab === "all" || tab === "open" || REQUEST_STATUSES.includes(tab) ? tab : "open");

  return (
    <div>
      <AdminPageHeader title="Seva Requests" />
      <p className="-mt-3 mb-5 max-w-2xl text-sm text-ink/60">
        Devotees ask for a seva on their own special day from the Sevas page. Call them back, then mark where it stands.
      </p>
      <nav className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter requests">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={{ pathname: "/admin/seva-requests", query: t.key === "open" ? {} : { show: t.key } }}
            aria-current={tab === t.key ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              tab === t.key ? "border-maroon bg-maroon text-cream" : "border-ink/15 bg-white/70 text-ink/70 hover:border-maroon/40"
            }`}
          >
            {t.label} <span className="opacity-70">({counts[t.key] ?? 0})</span>
          </Link>
        ))}
      </nav>
      {requests.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No requests here.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((r) => (
            <SevaRequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}

import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import UpiSettingsForm from "@/components/admin/UpiSettingsForm";
import WhatsappSettingsForm from "@/components/admin/WhatsappSettingsForm";
import PaymentLog from "@/components/admin/PaymentLog";
import RejectedAttempts from "@/components/admin/RejectedAttempts";
import { getPaymentLogForAdmin, getRejectedPaymentAttemptsForAdmin, type PaymentLogFilter } from "@/lib/data/bookings";
import { fetchSiteSettings } from "@/lib/data/site-settings";
import { getWhatsappSettings } from "@/lib/notify/whatsapp";

const FILTERS: { key: PaymentLogFilter | "auto"; label: string }[] = [
  { key: "submitted", label: "To verify" },
  { key: "paid", label: "Verified" },
  { key: "rejected", label: "Rejected by office" },
  { key: "auto", label: "Auto-rejected" },
  { key: "all", label: "All" },
];

// UPI payments: the temple's UPI details for devotees, and the log of
// every payment screenshot devotees uploaded, to verify or reject.
export default async function AdminPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ show?: string }>;
}) {
  const [{ locale }, { show }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const filter = FILTERS.find((f) => f.key === show)?.key ?? "submitted";
  const [{ entries, counts }, rejected, settings, whatsapp] = await Promise.all([
    getPaymentLogForAdmin(filter === "auto" ? "submitted" : filter),
    getRejectedPaymentAttemptsForAdmin(),
    fetchSiteSettings(),
    getWhatsappSettings(),
  ]);
  const tabCount = (key: PaymentLogFilter | "auto") => (key === "auto" ? rejected.count : counts[key]);

  return (
    <div className="space-y-10">
      <AdminPageHeader title="Payments" />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">UPI payment log</h2>
        <nav className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filter payments">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={{ pathname: "/admin/payments", query: f.key === "submitted" ? {} : { show: f.key } }}
              aria-current={filter === f.key ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                filter === f.key ? "border-maroon bg-maroon text-cream" : "border-ink/15 bg-white/70 text-ink/70 hover:border-maroon/40"
              }`}
            >
              {f.label} <span className="opacity-70">({tabCount(f.key)})</span>
            </Link>
          ))}
        </nav>
        {filter === "auto" ? <RejectedAttempts attempts={rejected.attempts} /> : <PaymentLog entries={entries} />}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">UPI details for devotees</h2>
        <UpiSettingsForm settings={settings} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">WhatsApp alerts</h2>
        <WhatsappSettingsForm phone={whatsapp.phone} keyHint={whatsapp.apikey ? whatsapp.apikey.slice(-4) : null} />
      </section>
    </div>
  );
}

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DatePickerField from "@/components/calendar/DatePickerField";
import { getDonationsForAdmin, type DonationFilters } from "@/lib/data/donations";
import { DONATION_PURPOSES, type Donation, type DonationPurpose } from "@/lib/devotee/types";

const PURPOSE_LABELS: Record<DonationPurpose, string> = {
  general: "General / Hundi",
  annadanam: "Annadanam",
  gau_seva: "Gau Seva",
  renovation: "Temple renovation",
  festival: "Festivals & utsavams",
};

const pick = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const isDate = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function AdminDonationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const purpose = pick(sp.purpose) as DonationPurpose | undefined;
  const filters: DonationFilters = {
    purpose: purpose && DONATION_PURPOSES.includes(purpose) ? purpose : undefined,
    from: isDate(pick(sp.from)),
    to: isDate(pick(sp.to)),
    q: pick(sp.q)?.slice(0, 60),
  };
  const { donations, total } = await getDonationsForAdmin(filters);
  return <Content donations={donations} total={total} filters={filters} />;
}

function Content({ donations, total, filters }: { donations: Donation[]; total: number; filters: DonationFilters }) {
  const t = useTranslations("admin");
  const query = new URLSearchParams(
    Object.entries({ purpose: filters.purpose, from: filters.from, to: filters.to, q: filters.q }).filter(
      (e): e is [string, string] => !!e[1],
    ),
  ).toString();
  const input = "rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold";
  const byPurpose = DONATION_PURPOSES.map((p) => [p, donations.filter((d) => d.purpose === p).reduce((n, d) => n + d.amount, 0)] as const).filter(
    ([, sum]) => sum > 0,
  );

  return (
    <div>
      <AdminPageHeader
        title={t("nav.donations")}
        action={
          <a
            href={`/api/admin/donations/export${query ? `?${query}` : ""}`}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-maroon hover:bg-black/[0.03]"
          >
            Export CSV
          </a>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={filters.q} placeholder="Name, phone, email or receipt" className={`${input} min-w-48 flex-1`} />
        <select name="purpose" defaultValue={filters.purpose ?? ""} className={input}>
          <option value="">All purposes</option>
          {DONATION_PURPOSES.map((p) => (
            <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
          ))}
        </select>
        <DatePickerField name="from" defaultValue={filters.from} allowPast clearable compact placeholder="From" />
        <DatePickerField name="to" defaultValue={filters.to} allowPast clearable compact placeholder="To" />
        <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">Filter</button>
        <a href="?" className="px-2 py-2 text-xs font-semibold text-ink/50 hover:text-maroon">Clear</a>
      </form>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-2xl font-bold text-maroon">₹{total.toLocaleString("en-IN")}</p>
          <p className="text-xs text-ink/55">Total received</p>
        </div>
        <div className="rounded-2xl border border-ink/10 p-4">
          <p className="text-2xl font-bold text-maroon">{donations.length}</p>
          <p className="text-xs text-ink/55">Donations</p>
        </div>
        {byPurpose.slice(0, 2).map(([p, sum]) => (
          <div key={p} className="rounded-2xl border border-ink/10 p-4">
            <p className="text-2xl font-bold text-maroon">₹{sum.toLocaleString("en-IN")}</p>
            <p className="text-xs text-ink/55">{PURPOSE_LABELS[p]}</p>
          </div>
        ))}
      </div>

      {donations.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No donations found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Paid on</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Receipt / Payment</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t border-ink/10 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {new Date(d.paidAt ?? d.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{d.donorName}</p>
                    <p className="text-xs text-ink/50">{[d.phone, d.email].filter(Boolean).join(" · ")}</p>
                    {d.note ? <p className="mt-1 text-xs italic text-ink/60">“{d.note}”</p> : null}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{PURPOSE_LABELS[d.purpose]}</td>
                  <td className="px-4 py-3 text-right font-semibold text-maroon">₹{d.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">
                    {d.receiptNo}
                    <br />
                    {d.paymentId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

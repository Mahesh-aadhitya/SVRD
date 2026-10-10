import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getDevoteesForAdmin, type DevoteeAccount } from "@/lib/data/devotees";

const pick = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export default async function AdminDevoteesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const q = pick((await searchParams).q)?.slice(0, 60);
  const devotees = await getDevoteesForAdmin(q);
  return <Content devotees={devotees} q={q} />;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "—";

function Content({ devotees, q }: { devotees: DevoteeAccount[]; q?: string }) {
  const t = useTranslations("admin");
  const input = "rounded-xl border border-ink/15 bg-black/[0.03] px-3 py-2 text-sm text-ink outline-none focus:border-gold";
  const stats = [
    [devotees.length, "Accounts"],
    [devotees.filter((d) => d.method === "google").length, "With Google"],
    [devotees.filter((d) => d.phone).length, "Mobile known"],
    [devotees.filter((d) => d.joinedThisWeek).length, "Joined this week"],
  ] as const;

  return (
    <div>
      <AdminPageHeader
        title={t("nav.devotees")}
        action={
          <a
            href={`/api/admin/devotees/export${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-maroon hover:bg-black/[0.03]"
          >
            Export CSV
          </a>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <input name="q" defaultValue={q} placeholder="Name, mobile or email" className={`${input} min-w-48 flex-1`} />
        <button className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-maroon-dark hover:brightness-105">Search</button>
        <a href="?" className="px-2 py-2 text-xs font-semibold text-ink/50 hover:text-maroon">Clear</a>
      </form>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([n, label]) => (
          <div key={label} className="rounded-2xl border border-ink/10 p-4">
            <p className="text-2xl font-bold text-maroon">{n}</p>
            <p className="text-xs text-ink/55">{label}</p>
          </div>
        ))}
      </div>

      {devotees.length === 0 ? (
        <p className="rounded-2xl border border-ink/10 p-6 text-center text-sm text-ink/50">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Signed up with</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3 text-right font-medium">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {devotees.map((d) => (
                <tr key={d.id} className="border-t border-ink/10 align-top">
                  <td className="px-4 py-3 font-medium text-ink">{d.name || <span className="text-ink/40">—</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {d.phone ? (
                      <a href={`tel:${d.phone}`} className="text-maroon hover:underline">{d.phone}</a>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${d.email}`} className="break-all text-ink/80 hover:text-maroon hover:underline">{d.email}</a>
                    {!d.verified ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Not verified</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{d.method === "google" ? "Google" : "Email"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">{when(d.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">{when(d.lastSignInAt)}</td>
                  <td className="px-4 py-3 text-right text-ink/70">{d.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

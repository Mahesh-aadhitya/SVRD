import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ProfileForm from "@/components/account/ProfileForm";
import ClaimBookingForm from "@/components/account/ClaimBookingForm";
import { ensureProfile, requireDevotee } from "@/lib/devotee/auth";
import { getBookingsForUser, type Ticket } from "@/lib/data/bookings";
import { getDonationsForUser } from "@/lib/data/donations";
import { signOutDevotee } from "@/lib/actions/account";
import { signTicket } from "@/lib/ticket-token";
import { formatIso, todayInIndia } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const TABS = ["bookings", "donations", "profile"] as const;
type Tab = (typeof TABS)[number];

// The devotee's own space: every seva booked (with darshan / prasadam
// status and the live ticket), donations with receipts, and saved details.
export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const devotee = await requireDevotee(locale, "/account");
  const tab: Tab = TABS.find((x) => x === sp.tab) ?? "bookings";
  const [profile, bookings, donations, t] = await Promise.all([
    ensureProfile(devotee),
    getBookingsForUser(devotee.id),
    getDonationsForUser(devotee.id),
    getTranslations("account"),
  ]);
  const lang = locale === "kn" ? "kn" : "en";
  const today = todayInIndia();
  const active = bookings.filter((b) => b.status !== "cancelled");
  const upcoming = active.filter((b) => b.date >= today && !b.checkedInAt);
  const past = bookings.filter((b) => !upcoming.includes(b));

  const stats: [string, string | number][] = [
    [t("stats.bookings"), active.length],
    [t("stats.upcoming"), upcoming.length],
    [t("stats.darshans"), bookings.filter((b) => b.checkedInAt).length],
    [t("stats.donated"), `₹${donations.reduce((n, d) => n + d.amount, 0).toLocaleString("en-IN")}`],
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Who's signed in */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-gold/30 bg-white/80 p-5 shadow-sm">
        {devotee.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={devotee.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full border-2 border-gold/60" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-maroon text-xl text-cream">
            {(profile.fullName || devotee.email).charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink/55">{t("namaskara")}</p>
          <p className="truncate font-display text-2xl text-maroon">{profile.fullName || devotee.name}</p>
          <p className="truncate text-xs text-ink/55">{devotee.email}</p>
        </div>
        <form action={signOutDevotee.bind(null, locale)}>
          <button className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-black/[0.03]">
            {t("signOut")}
          </button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gold/25 bg-white/70 p-4">
            <p className="text-2xl font-bold text-maroon">{value}</p>
            <p className="text-xs text-ink/55">{label}</p>
          </div>
        ))}
      </div>

      <nav className="mt-6 flex gap-1 border-b border-gold/25">
        {TABS.map((key) => (
          <Link
            key={key}
            href={{ pathname: "/account", query: key === "bookings" ? {} : { tab: key } }}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === key ? "border-maroon text-maroon" : "border-transparent text-ink/55 hover:text-maroon"
            }`}
          >
            {t(`tabs.${key}`)}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "bookings" ? (
          <div className="space-y-8">
            <BookingList title={t("upcoming")} empty={t("noUpcoming")} bookings={upcoming} lang={lang} t={t} />
            <BookingList title={t("history")} empty={t("noHistory")} bookings={past} lang={lang} t={t} />
            <div className="rounded-2xl border border-dashed border-gold/40 p-5">
              <p className="font-semibold text-maroon">{t("claimTitle")}</p>
              <p className="mb-3 mt-1 text-sm text-ink/60">{t("claimBody")}</p>
              <ClaimBookingForm />
            </div>
            <Link href="/booking" className="inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark">
              {t("bookSeva")}
            </Link>
          </div>
        ) : tab === "donations" ? (
          <div>
            {donations.length === 0 ? (
              <p className="rounded-2xl border border-gold/25 p-6 text-center text-sm text-ink/55">{t("noDonations")}</p>
            ) : (
              <ul className="divide-y divide-gold/20 overflow-hidden rounded-2xl border border-gold/25 bg-white/70">
                {donations.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{t(`purposes.${d.purpose}`)}</p>
                      <p className="text-xs text-ink/55">
                        {formatIso(istDay(d.paidAt ?? d.createdAt), lang, { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                        <span className="font-mono">{d.receiptNo}</span>
                      </p>
                    </div>
                    <p className="text-lg font-bold text-maroon">₹{d.amount.toLocaleString("en-IN")}</p>
                    <Link href={`/account/donations/${d.receiptNo}`} className="text-sm font-semibold text-maroon hover:underline">
                      {t("receipt")} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/donate" className="mt-5 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark">
              {t("donate")}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gold/25 bg-white/70 p-5">
            <p className="mb-4 text-sm text-ink/60">{t("profileNote")}</p>
            <ProfileForm profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

const istDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(iso));

function BookingList({
  title,
  empty,
  bookings,
  lang,
  t,
}: {
  title: string;
  empty: string;
  bookings: Ticket[];
  lang: "en" | "kn";
  t: Awaited<ReturnType<typeof getTranslations<"account">>>;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl text-maroon">{title}</h2>
      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-gold/25 p-5 text-center text-sm text-ink/55">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const status = b.prasadamClaimedAt
              ? "completed"
              : b.checkedInAt
                ? "darshanDone"
                : b.status === "cancelled"
                  ? "cancelled"
                  : b.amount > 0 && b.paymentStatus !== "paid"
                    ? "payAtCounter"
                    : "confirmed";
            const tone = {
              completed: "bg-green-600/15 text-green-800",
              darshanDone: "bg-sky-600/15 text-sky-800",
              cancelled: "bg-red-600/15 text-red-700",
              payAtCounter: "bg-amber-500/20 text-amber-900",
              confirmed: "bg-gold/25 text-maroon",
            }[status];
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/25 bg-white/70 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{b.sevaName[lang]}</p>
                  <p className="text-sm text-ink/65">
                    {formatIso(b.date, lang, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    {b.slot ? ` · ${formatSlot(b.slot, lang)}` : ""} · {t("tickets", { count: b.quantity })}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    <span className="font-mono">{b.reference}</span>
                    {b.amount > 0 ? ` · ₹${b.amount}` : ""}
                    {b.checkedInAt ? ` · ${t(b.prasadamClaimedAt ? "prasadamDone" : "prasadamPending")}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{t(`status.${status}`)}</span>
                {b.reference ? (
                  <Link
                    href={{ pathname: `/ticket/${b.reference}`, query: { t: signTicket(b.reference) } }}
                    className="text-sm font-semibold text-maroon hover:underline"
                  >
                    {t("viewTicket")} →
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

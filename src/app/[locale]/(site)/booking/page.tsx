import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "@/i18n/navigation";
import BookingFlow from "@/components/BookingFlow";
import { getActiveSevas } from "@/lib/data/sevas";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import type { DevoteeProfile } from "@/lib/devotee/types";
import { getFolders } from "@/lib/data/folders";
import type { Folder } from "@/lib/folders";
import { getSiteSettings } from "@/lib/data/site-settings";
import { upiReady } from "@/lib/content-types";
import type { UpiDetails } from "@/components/payment/UpiPaymentPanel";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const devotee = await getDevotee();
  // Booking needs a devotee account: signed-out visitors are told so, with
  // a button to the sign-in page (Google or email) that brings them back
  // to this same booking.
  if (!devotee) {
    const query = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    const back = `/booking${query.size ? `?${query}` : ""}`;
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SignInRequired loginHref={`/login?next=${encodeURIComponent(back)}`} />
      </div>
    );
  }
  const [sevas, folders, settings] = await Promise.all([
    getActiveSevas(),
    getFolders("sevas"),
    getSiteSettings().catch(() => null),
  ]);
  const upi: UpiDetails | null =
    settings && upiReady(settings)
      ? { upiId: settings.upiId, upiNumber: settings.upiNumber, upiPayeeName: settings.upiPayeeName, upiQrUrl: settings.upiQrUrl }
      : null;
  // Booking needs a devotee account, so every booking shows up in their history.
  const profile = devotee ? await ensureProfile(devotee).catch(() => null) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BookingContent sevas={sevas} folders={folders} profile={profile} upi={upi} />
    </div>
  );
}

function SignInRequired({ loginHref }: { loginHref: string }) {
  const t = useTranslations("booking");
  const tAuth = useTranslations("auth");
  return (
    <>
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <div className="mx-auto mt-8 max-w-md rounded-3xl border border-gold/30 bg-white/80 p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-maroon/10 text-maroon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <p className="mt-4 font-display text-xl text-maroon">{t("signInTitle")}</p>
        <p className="mt-2 text-sm text-ink/65">{t("signInBody")}</p>
        <Link
          href={loginHref}
          className="mt-6 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark"
        >
          {tAuth("signIn")}
        </Link>
      </div>
    </>
  );
}

function BookingContent({
  sevas,
  folders,
  profile,
  upi,
}: {
  sevas: Awaited<ReturnType<typeof getActiveSevas>>;
  folders: Folder[];
  profile: DevoteeProfile | null;
  upi: UpiDetails | null;
}) {
  const t = useTranslations("booking");
  const tTicket = useTranslations("ticket");

  return (
    <>
      <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <Link href="/ticket" className="mt-2 inline-block text-sm font-semibold text-maroon underline-offset-4 hover:underline">
        {tTicket("findLink")} →
      </Link>
      <Suspense fallback={null}>
        <BookingFlow sevas={sevas} folders={folders} profile={profile} upi={upi} />
      </Suspense>
    </>
  );
}

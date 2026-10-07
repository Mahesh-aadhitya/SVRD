import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "@/i18n/navigation";
import BookingFlow from "@/components/BookingFlow";
import { getActiveSevas } from "@/lib/data/sevas";
import GoogleSignInButton from "@/components/account/GoogleSignInButton";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import type { DevoteeProfile } from "@/lib/devotee/types";
import { getFolders } from "@/lib/data/folders";
import type { Folder } from "@/lib/folders";
import { getSiteSettings } from "@/lib/data/site-settings";
import { upiReady } from "@/lib/content-types";
import type { UpiDetails } from "@/components/payment/UpiPaymentPanel";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [sevas, folders, devotee, settings] = await Promise.all([
    getActiveSevas(),
    getFolders("sevas"),
    getDevotee(),
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
      <BookingContent sevas={sevas} folders={folders} signedIn={!!devotee} profile={profile} upi={upi} />
    </div>
  );
}

function BookingContent({
  sevas,
  folders,
  signedIn,
  profile,
  upi,
}: {
  sevas: Awaited<ReturnType<typeof getActiveSevas>>;
  folders: Folder[];
  signedIn: boolean;
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
      {signedIn ? (
        <Suspense fallback={null}>
          <BookingFlow sevas={sevas} folders={folders} profile={profile} upi={upi} />
        </Suspense>
      ) : (
        <div className="mx-auto mt-8 max-w-md rounded-3xl border border-gold/30 bg-white/80 p-8 text-center shadow-sm">
          <p className="font-display text-xl text-maroon">{t("signInTitle")}</p>
          <p className="mt-2 text-sm text-ink/65">{t("signInBody")}</p>
          <div className="mt-6">
            <GoogleSignInButton next="/booking" />
          </div>
        </div>
      )}
    </>
  );
}

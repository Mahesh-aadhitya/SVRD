import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "@/i18n/navigation";
import SevaRequestForm from "@/components/SevaRequestForm";
import { getListedSevas } from "@/lib/data/sevas";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "sevaRequest" });
  return { title: t("pageTitle") };
}

// A devotee asks for a seva on a day of their own (a birthday, an
// anniversary…): any listed seva, or one they describe. The priest is told
// and calls them back — nothing is booked or paid here.
export default async function SevaRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ seva?: string }>;
}) {
  const [{ locale }, { seva }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const devotee = await getDevotee();
  if (!devotee) {
    const back = `/seva-request${seva ? `?seva=${encodeURIComponent(seva)}` : ""}`;
    return <SignInFirst loginHref={`/login?next=${encodeURIComponent(back)}`} />;
  }
  const [sevas, profile] = await Promise.all([getListedSevas(), ensureProfile(devotee).catch(() => null)]);
  // Every listed seva: on-request ones too, for a day their booking rules
  // don't offer (sooner than the notice, or another weekday).
  const choices = sevas.filter((s) => s.allowRequests).map((s) => ({ id: s.id, name: s.name, onRequest: s.frequency === "request" }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Heading />
      <SevaRequestForm
        sevas={choices}
        initialSevaId={choices.some((c) => c.id === seva) ? seva! : null}
        defaultName={profile?.fullName || devotee.name}
        defaultGotram={profile?.gotram ?? ""}
        defaultNakshatram={profile?.nakshatram ?? ""}
        defaultPhone={profile?.phone ?? ""}
      />
    </div>
  );
}

function Heading() {
  const t = useTranslations("sevaRequest");
  return <SectionHeading title={t("pageTitle")} subtitle={t("pageSubtitle")} />;
}

function SignInFirst({ loginHref }: { loginHref: string }) {
  const t = useTranslations("sevaRequest");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Heading />
      <div className="mx-auto mt-8 max-w-md rounded-3xl border border-gold/30 bg-white/80 p-8 text-center shadow-sm">
        <p className="font-display text-xl text-maroon">{t("signInTitle")}</p>
        <p className="mt-2 text-sm text-ink/65">{t("signInBody")}</p>
        <Link href={loginHref} className="mt-6 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark">
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}

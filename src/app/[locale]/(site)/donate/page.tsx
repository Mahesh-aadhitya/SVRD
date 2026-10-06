import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHeading from "@/components/SectionHeading";
import GoogleSignInButton from "@/components/account/GoogleSignInButton";
import DonateForm from "@/components/donate/DonateForm";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import { razorpayConfigured } from "@/lib/razorpay";

export default async function DonatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, devotee] = await Promise.all([getTranslations("donate"), getDevotee()]);
  const profile = devotee ? await ensureProfile(devotee) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="mt-8 rounded-3xl border border-gold/30 bg-white/80 p-5 shadow-sm sm:p-7">
        {!razorpayConfigured() ? (
          <p className="text-center text-sm text-ink/65">{t("unavailable")}</p>
        ) : profile ? (
          <DonateForm profile={profile} />
        ) : (
          <div className="py-4 text-center">
            <p className="font-display text-xl text-maroon">{t("signInTitle")}</p>
            <p className="mt-2 text-sm text-ink/65">{t("signInBody")}</p>
            <div className="mt-6">
              <GoogleSignInButton next="/donate" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

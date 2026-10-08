import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import GoogleSignInButton from "@/components/account/GoogleSignInButton";
import EmailAuthPanel from "@/components/account/EmailAuthPanel";
import { getDevotee } from "@/lib/devotee/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Only same-site paths, without the locale prefix (the forms add it).
function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.replace(/^\/(en|kn)(?=\/|$)/, "") || "/";
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const next = safeNext(sp.next);
  if (await getDevotee()) redirect({ href: next, locale });
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid overflow-hidden rounded-3xl border border-gold/30 bg-white/85 shadow-lg lg:grid-cols-[1fr_1.1fr]">
        {/* Welcome panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-maroon-dark via-maroon to-[#8a3a1c] p-10 text-cream lg:block">
          <Image
            src="/images/chakra-watermark.png"
            alt=""
            width={1200}
            height={1432}
            className="pointer-events-none absolute -bottom-16 -right-20 w-80 opacity-10 brightness-0 invert"
          />
          <div className="relative mx-auto h-52 w-40 overflow-hidden rounded-t-full border-2 border-gold/70 shadow-xl">
            <Image src="/images/deity-hero.png" alt="" fill sizes="160px" className="object-cover object-[50%_12%]" />
          </div>
          <p className="relative mt-6 text-center font-display text-3xl leading-tight">{t("title")}</p>
          <p className="relative mt-2 text-center text-sm text-cream/75">{t("subtitle")}</p>
          <ul className="relative mx-auto mt-7 max-w-xs space-y-3 text-sm">
            {(["benefitBook", "benefitHistory", "benefitDonate"] as const).map((k) => (
              <li key={k} className="flex gap-3">
                <span className="text-gold-light">✦</span>
                <span className="text-cream/90">{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-in options */}
        <div className="p-6 sm:p-10">
          <div className="text-center lg:hidden">
            <Image src="/images/chakra-loader.png" alt="" width={268} height={320} className="mx-auto h-20 w-auto" />
            <h1 className="mt-3 font-display text-2xl text-maroon">{t("title")}</h1>
            <p className="mt-1 text-sm text-ink/65">{t("subtitle")}</p>
          </div>
          <h1 className="hidden font-display text-2xl text-maroon lg:block">{t("welcome")}</h1>
          <p className="hidden text-sm text-ink/60 lg:block">{t("welcomeBody")}</p>

          <div className="mt-6">
            <GoogleSignInButton next={next} />
          </div>
          {sp.error ? <p className="mt-3 text-center text-sm text-red-700">{t("callbackError")}</p> : null}

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink/40">
            <span className="h-px flex-1 bg-gold/30" />
            {t("orEmail")}
            <span className="h-px flex-1 bg-gold/30" />
          </div>

          <EmailAuthPanel next={next} />

          <p className="mt-8 text-center text-[11px] leading-relaxed text-ink/45">{t("privacy")}</p>
        </div>
      </div>
    </div>
  );
}

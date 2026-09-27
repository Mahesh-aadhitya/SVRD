import type { Metadata, Viewport } from "next";
import { Yatra_One, Padyakke_Expanded_One, Inter, Noto_Sans_Kannada } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import PwaRegister from "@/components/PwaRegister";
import "../globals.css";

// Yatra One: a Devanagari/Sanskrit-lettering-inspired display face (also
// used for Latin text), paired with Padyakke Expanded One (bold, upright,
// carved-inscription letterforms) so headings keep the same ceremonial,
// temple-carved character across both languages instead of switching to
// a generic sans for Kannada.
const displayFont = Yatra_One({
  variable: "--font-temple-display",
  subsets: ["latin"],
  weight: "400",
});

const displayFontKn = Padyakke_Expanded_One({
  variable: "--font-temple-display-kn",
  subsets: ["kannada"],
  weight: "400",
});

const sansFont = Inter({
  variable: "--font-temple-sans",
  subsets: ["latin"],
});

const kannadaFont = Noto_Sans_Kannada({
  variable: "--font-temple-kannada",
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { default: t("siteTitle"), template: `%s · ${t("siteTitle")}` },
    description: t("siteTagline"),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: t("siteTitle"),
    },
    icons: {
      icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#7a1f1f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${displayFont.variable} ${displayFontKn.variable} ${sansFont.variable} ${kannadaFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <NextIntlClientProvider>
          {children}
          <PwaRegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

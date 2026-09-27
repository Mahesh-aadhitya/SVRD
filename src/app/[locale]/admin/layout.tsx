import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen overflow-hidden bg-maroon-dark text-cream">
      <Image
        src="/images/emblem-chakra.png"
        alt=""
        width={360}
        height={386}
        className="pointer-events-none absolute -right-20 -top-16 -z-0 opacity-[0.06]"
        aria-hidden
      />
      <AdminHeader />
      <div className="relative mx-auto flex max-w-6xl flex-col lg:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function AdminHeader() {
  const t = useTranslations("admin");

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-xl text-gold-light">{t("portalTitle")}</p>
          <p className="text-xs text-cream/60">{t("portalSubtitle")}</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-cream/80 hover:bg-white/5"
        >
          {"←"} Back to site
        </Link>
      </div>
      <p className="bg-gold/15 px-4 py-2 text-center text-xs font-medium text-gold-light sm:px-6">
        {t("previewBanner")}
      </p>
    </header>
  );
}

import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin/dal";
import { logout } from "../login/actions";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin(locale as Locale);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <Image
        src="/images/emblem-chakra.png"
        alt=""
        width={360}
        height={386}
        className="pointer-events-none absolute -right-20 -top-16 -z-0 opacity-[0.06]"
        aria-hidden
      />
      <AdminHeader email={admin.email} locale={locale as Locale} />
      <div className="relative mx-auto flex max-w-6xl flex-col lg:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function AdminHeader({ email, locale }: { email: string; locale: Locale }) {
  const t = useTranslations("admin");
  const logoutWithLocale = logout.bind(null, locale);

  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <p className="font-display text-xl text-maroon">{t("portalTitle")}</p>
          <p className="text-xs text-ink/60">{t("portalSubtitle")}</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/80 hover:bg-black/[0.03]"
        >
          {"←"} Back to site
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gold/15 px-4 py-2 text-xs font-medium text-maroon sm:px-6">
        <span>{t("session.signedInAs", { email })}</span>
        <form action={logoutWithLocale}>
          <button type="submit" className="underline underline-offset-2 hover:text-ink">
            {t("session.logout")}
          </button>
        </form>
      </div>
    </header>
  );
}

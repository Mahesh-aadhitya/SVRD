import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 text-ink">
      <Image
        src="/images/emblem-chakra.png"
        alt=""
        width={360}
        height={386}
        className="pointer-events-none absolute -right-20 -top-16 -z-0 opacity-[0.06]"
        aria-hidden
      />
      <LoginForm />
    </div>
  );
}

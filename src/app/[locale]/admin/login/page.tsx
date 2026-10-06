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
        src="/images/chakra-watermark.png"
        alt=""
        width={1200}
        height={1432}
        className="pointer-events-none absolute right-4 top-28 -z-0 hidden h-[380px] w-auto opacity-[0.05] lg:block"
        aria-hidden
      />
      <LoginForm />
    </div>
  );
}

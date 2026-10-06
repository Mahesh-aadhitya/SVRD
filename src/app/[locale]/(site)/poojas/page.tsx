import { redirect } from "@/i18n/navigation";

// Poojas became Sevas (nitya, monthly and annual) — keep old links working.
export default async function PoojasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/sevas", locale });
}

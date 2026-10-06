import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import FindTicketForm from "@/components/ticket/FindTicketForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function FindTicketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <FindTicketForm />
    </div>
  );
}

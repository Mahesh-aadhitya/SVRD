import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import TicketCard from "@/components/ticket/TicketCard";
import TicketActions from "@/components/ticket/TicketActions";
import { getBookingForTicket } from "@/lib/data/bookings";
import { getTempleInfo } from "@/lib/data/temple-info";
import { signTicket, verifyTicket } from "@/lib/ticket-token";
import { getCurrentAdmin } from "@/lib/admin/dal";
import { getSiteSettings } from "@/lib/data/site-settings";
import { upiReady } from "@/lib/content-types";
import TicketPayment from "@/components/payment/TicketPayment";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; reference: string }>;
  searchParams: Promise<{ t?: string; scan?: string; paid?: string }>;
}) {
  const [{ locale, reference }, { t: token, scan, paid }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("ticket");

  const ref = reference.toUpperCase();
  const ticket = verifyTicket(ref, token) ? await getBookingForTicket(ref) : null;

  if (!ticket) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl text-maroon">{t("notFoundTitle")}</p>
        <p className="mt-2 text-sm text-ink/70">{t("notFoundBody")}</p>
        <Link href="/ticket" className="mt-6 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream">
          {t("findTitle")}
        </Link>
      </div>
    );
  }

  // Only the QR's link carries scan=1: a signed-in admin scanning it with
  // the phone camera goes to the verify screen (which checks the ticket
  // in). Opening the ticket any other way — even as admin — just shows it.
  const admin = await getCurrentAdmin();
  if (admin && scan === "1") {
    redirect({ href: `/admin/verify/${ref}`, locale });
  }

  const [temple, settings] = await Promise.all([getTempleInfo().catch(() => null), getSiteSettings().catch(() => null)]);
  const awaitingPayment = ticket.amount > 0 && ticket.status !== "cancelled" && ticket.paymentStatus === "unpaid";
  const tMeta = await getTranslations("meta");
  const tPay = await getTranslations("payment");

  // The QR encodes this ticket's own signed link, so scanning it at the
  // counter shows the live booking and payment status.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const ticketUrl = `${origin}${locale === "kn" ? "/kn" : ""}/ticket/${ref}?t=${signTicket(ref)}&scan=1`;
  const qrSvg = await QRCode.toString(ticketUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#2a1b12" } });

  return (
    <div className="px-4 py-10 sm:px-6">
      {admin ? (
        <div className="mx-auto mb-4 flex max-w-[794px] flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm text-maroon">
          <span>Signed in as admin.</span>
          <Link href={`/admin/verify/${ref}`} className="font-semibold underline underline-offset-2">
            Verify / check in this ticket →
          </Link>
        </div>
      ) : null}
      {awaitingPayment && settings && upiReady(settings) ? (
        <TicketPayment
          reference={ref}
          ticketToken={signTicket(ref)}
          amount={ticket.amount}
          upi={{ upiId: settings.upiId, upiNumber: settings.upiNumber, upiPayeeName: settings.upiPayeeName, upiQrUrl: settings.upiQrUrl }}
          fallbackPayee={tMeta("siteTitle")}
          rejectedNote={ticket.paymentReviewedAt ? ticket.paymentNote : null}
        />
      ) : paid === "1" && ticket.paymentStatus === "submitted" ? (
        <p className="mx-auto mb-6 max-w-[794px] rounded-2xl border border-green-600/30 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
          {tPay("submittedBanner")}
        </p>
      ) : null}
      <TicketCard ticket={ticket} temple={temple} qrSvg={qrSvg} locale={locale === "kn" ? "kn" : "en"} />
      <TicketActions reference={ticket.reference ?? ref} />
    </div>
  );
}

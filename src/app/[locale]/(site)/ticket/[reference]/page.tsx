import type { Metadata } from "next";
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
import { siteOrigin } from "@/lib/site-url";
import TicketPayment from "@/components/payment/TicketPayment";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatIso } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";
import { PAYMENT_HOLD_MINUTES } from "@/lib/payment-hold";

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
  const lang = locale === "kn" ? "kn" : "en";
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
  // A paid seva gets its ticket only once it's paid (or, in the UPI QR
  // flow, once the screenshot is in).
  const unpaid = ticket.amount > 0 && ticket.paymentStatus === "unpaid";
  const awaitingPayment = unpaid && ticket.status !== "cancelled";
  const tMeta = await getTranslations("meta");
  const tPay = await getTranslations("payment");
  const tBooking = await getTranslations("booking");
  const online = razorpayConfigured();
  const upi = settings && upiReady(settings) ? settings : null;

  // The QR encodes this ticket's own signed link, so scanning it at the
  // counter shows the live booking and payment status.
  const origin = await siteOrigin();
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
      {unpaid ? (
        <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-gold/30 bg-white/80 p-5 text-center shadow-sm sm:p-6">
          <p className="font-display text-2xl text-maroon">{awaitingPayment ? tPay("payForTicketTitle") : tPay("releasedTitle")}</p>
          <p className="mt-2 font-semibold text-ink">{ticket.sevaName[lang]}</p>
          <p className="text-sm text-ink/70">
            {formatIso(ticket.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {ticket.slot ? ` · ${formatSlot(ticket.slot, lang)}` : ""} · {tBooking("ticketCount", { count: ticket.quantity })} · ₹{ticket.amount}
          </p>
          <p className="mt-1 font-mono text-sm tracking-widest text-ink/60">{ref}</p>
          <p className="mt-3 text-sm text-ink/70">
            {awaitingPayment
              ? online && ticket.paymentMethod === "razorpay"
                ? tPay("payForTicketHold", { minutes: PAYMENT_HOLD_MINUTES })
                : tPay("payForTicketBody")
              : tPay("releasedBody")}
          </p>
          {awaitingPayment ? (
            online || upi ? (
              <div className="mt-4 text-left">
                <TicketPayment
                  reference={ref}
                  ticketToken={signTicket(ref)}
                  amount={ticket.amount}
                  online={online}
                  upi={upi && { upiId: upi.upiId, upiNumber: upi.upiNumber, upiPayeeName: upi.upiPayeeName, upiQrUrl: upi.upiQrUrl }}
                  fallbackPayee={tMeta("siteTitle")}
                  rejectedNote={ticket.paymentReviewedAt ? ticket.paymentNote : null}
                />
              </div>
            ) : null
          ) : (
            <Link href="/booking" className="mt-4 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark">
              {tPay("bookAgain")}
            </Link>
          )}
        </div>
      ) : (
        <>
          {paid === "1" ? (
            <p className="mx-auto mb-6 max-w-[794px] rounded-2xl border border-green-600/30 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
              {tPay(ticket.paymentStatus === "paid" ? "onlinePaidBanner" : "submittedBanner")}
            </p>
          ) : null}
          <TicketCard ticket={ticket} temple={temple} qrSvg={qrSvg} locale={lang} />
          <TicketActions reference={ticket.reference ?? ref} />
        </>
      )}
    </div>
  );
}

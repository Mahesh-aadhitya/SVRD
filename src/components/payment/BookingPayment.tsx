"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { confirmOnlinePayment, startOnlinePayment } from "@/lib/actions/payments";
import { loadCheckout, upiFirst, type RazorpayHandlerResponse } from "@/lib/razorpay-checkout";
import UpiPaymentPanel, { type UpiDetails } from "./UpiPaymentPanel";

/**
 * How a devotee pays for a seva booking: online through Razorpay (UPI
 * first, then cards and netbanking — confirmed instantly) when it's set
 * up. Until then, the temple's UPI QR + screenshot.
 */
export default function BookingPayment({
  online,
  upi,
  onPaid,
  ...panel
}: {
  /** Razorpay keys are configured. */
  online: boolean;
  upi: UpiDetails | null;
  /** A signed online payment came back (the booking is now paid). */
  onPaid: () => void;
  mode: "booking" | "ticket";
  reference: string;
  ticketToken: string;
  amount: number;
  fallbackPayee: string;
  rejectedNote?: string | null;
  onSubmitted: (utr: string | null) => void;
}) {
  const t = useTranslations("payment");
  const tMeta = useTranslations("meta");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payOnline() {
    setBusy(true);
    setError(null);
    const [started, loaded] = await Promise.all([startOnlinePayment(panel.reference, panel.ticketToken), loadCheckout()]);
    if (!started.ok) {
      setBusy(false);
      return setError(t(`errors.${started.error}`));
    }
    if (!loaded || !window.Razorpay) {
      setBusy(false);
      return setError(t("checkoutFailed"));
    }
    const rzp = new window.Razorpay({
      key: started.keyId,
      order_id: started.orderId,
      amount: started.amountPaise,
      currency: "INR",
      name: tMeta("siteTitle"),
      description: `Seva ${panel.reference}`,
      prefill: started.prefill,
      notes: { reference: panel.reference },
      theme: { color: "#7a1f1f" },
      config: upiFirst(started.keyId),
      // The window closes when the seat hold runs out.
      timeout: started.holdSeconds,
      handler: async (res: RazorpayHandlerResponse) => {
        // If confirming here fails, the webhook still records the payment.
        await confirmOnlinePayment({
          orderId: res.razorpay_order_id,
          paymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
          locale,
        }).catch(() => null);
        onPaid();
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => {
      setBusy(false);
      setError(t("onlineFailed"));
    });
    rzp.open();
  }

  if (!online) return upi ? <UpiPaymentPanel upi={upi} {...panel} /> : null;

  return (
    <div className="rounded-2xl border border-gold/40 bg-white/90 p-4 text-left shadow-sm sm:p-5">
      <button
        type="button"
        onClick={payOnline}
        disabled={busy}
        className="h-12 w-full rounded-full bg-maroon px-6 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark disabled:opacity-50"
      >
        {busy ? t("pleaseWait") : t("payOnline", { amount: panel.amount })}
      </button>
      <p className="mt-2 text-center text-xs text-ink/55">{t("payOnlineHint")}</p>
      {error ? (
        <p role="alert" className="mt-3 rounded-xl border border-red-600/30 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

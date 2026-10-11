"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import BookingPayment from "./BookingPayment";
import type { UpiDetails } from "./UpiPaymentPanel";

// Payment on the ticket page itself, for a booking still awaiting payment
// (online, or UPI QR + screenshot): once paid or the screenshot is in, the
// ticket below re-renders as the receipt, with the transaction reference.
export default function TicketPayment(props: {
  reference: string;
  ticketToken: string;
  amount: number;
  upi: UpiDetails | null;
  online: boolean;
  fallbackPayee: string;
  rejectedNote: string | null;
}) {
  const t = useTranslations("payment");
  const router = useRouter();
  const [done, setDone] = useState<"paid" | "submitted" | null>(null);

  return (
    <div id="pay" className="scroll-mt-4">
      {!done ? (
        <BookingPayment
          mode="ticket"
          {...props}
          onPaid={() => {
            setDone("paid");
            router.refresh();
          }}
          onSubmitted={() => {
            setDone("submitted");
            router.refresh();
          }}
        />
      ) : (
        <p className="rounded-2xl border border-green-600/30 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
          {t(done === "paid" ? "onlinePaidBanner" : "submittedBanner")}
        </p>
      )}
    </div>
  );
}

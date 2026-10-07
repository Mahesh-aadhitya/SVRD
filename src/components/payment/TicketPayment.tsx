"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import UpiPaymentPanel, { type UpiDetails } from "./UpiPaymentPanel";

// Pay-by-UPI on the ticket page itself, for a booking still awaiting
// payment: once the screenshot is in, the ticket below re-renders as the
// receipt, with the transaction reference.
export default function TicketPayment(props: {
  reference: string;
  ticketToken: string;
  amount: number;
  upi: UpiDetails;
  fallbackPayee: string;
  rejectedNote: string | null;
}) {
  const t = useTranslations("payment");
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div id="pay" className="mx-auto mb-6 max-w-[794px] scroll-mt-4">
      {open ? (
        <UpiPaymentPanel
          mode="ticket"
          {...props}
          onSubmitted={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : (
        <p className="rounded-2xl border border-green-600/30 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
          {t("submittedBanner")}
        </p>
      )}
    </div>
  );
}

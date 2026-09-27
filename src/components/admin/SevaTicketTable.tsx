"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sevas } from "@/lib/placeholder-data";
import type { Locale } from "@/i18n/routing";

export default function SevaTicketTable() {
  const t = useTranslations("admin");
  const tBooking = useTranslations("booking");
  const locale = useLocale() as Locale;
  const [released, setReleased] = useState<Record<string, boolean>>(
    Object.fromEntries(sevas.map((s) => [s.id, true]))
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-cream/50">
          <tr>
            <th className="px-4 py-3 font-medium">Seva</th>
            <th className="px-4 py-3 font-medium">{tBooking("priceLabel")}</th>
            <th className="px-4 py-3 font-medium">Capacity / slot</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Tickets</th>
          </tr>
        </thead>
        <tbody>
          {sevas.map((seva) => {
            const isReleased = released[seva.id];
            return (
              <tr key={seva.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-medium text-cream">{seva.name[locale]}</td>
                <td className="px-4 py-3 text-cream/70">
                  {seva.price === 0 ? tBooking("priceFree") : `₹${seva.price}`}
                </td>
                <td className="px-4 py-3 text-cream/70">{seva.capacityPerSlot}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      isReleased
                        ? "bg-gold/20 text-gold-light"
                        : "bg-white/10 text-cream/50"
                    }`}
                  >
                    {isReleased ? "Released" : "Closed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setReleased((prev) => ({ ...prev, [seva.id]: !prev[seva.id] }))
                    }
                    className="text-xs font-semibold text-gold-light hover:underline"
                  >
                    {isReleased ? t("actions.close") : t("actions.release")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

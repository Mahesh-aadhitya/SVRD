import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { closeSeva } from "@/lib/actions/sevas";
import ReleaseSevaForm from "@/app/[locale]/admin/(protected)/sevas/ReleaseSevaForm";
import type { Locale } from "@/i18n/routing";
import type { Seva } from "@/lib/seva-types";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function SevaTicketTable({ sevas }: { sevas: Seva[] }) {
  const t = useTranslations("admin");
  const tBooking = useTranslations("booking");
  const locale = useLocale() as Locale;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3 font-medium">Seva</th>
            <th className="px-4 py-3 font-medium">{tBooking("priceLabel")}</th>
            <th className="px-4 py-3 font-medium">Capacity / slot</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Tickets</th>
          </tr>
        </thead>
        <tbody>
          {sevas.map((seva) => (
            <tr key={seva.id} className="border-t border-ink/10">
              <td className="px-4 py-3 font-medium text-ink">{seva.name[locale]}</td>
              <td className="px-4 py-3 text-ink/70">
                {seva.price === 0 ? tBooking("priceFree") : `₹${seva.price}`}
              </td>
              <td className="px-4 py-3 text-ink/70">{seva.capacityPerSlot}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs ${
                    seva.isActive ? "bg-gold/20 text-maroon" : "bg-black/5 text-ink/50"
                  }`}
                >
                  {seva.isActive && seva.releaseStartDate && seva.releaseEndDate
                    ? `Released: ${formatDate(seva.releaseStartDate)} – ${formatDate(seva.releaseEndDate)}`
                    : seva.isActive
                      ? "Released"
                      : "Closed"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-end gap-1.5">
                  <ReleaseSevaForm seva={seva} />
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/sevas/${seva.id}/edit`}
                      className="text-xs font-semibold text-maroon hover:underline"
                    >
                      {t("actions.edit")}
                    </Link>
                    {seva.isActive ? (
                      <form action={closeSeva.bind(null, seva.id)}>
                        <button type="submit" className="text-xs font-semibold text-maroon hover:underline">
                          {t("actions.close")}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

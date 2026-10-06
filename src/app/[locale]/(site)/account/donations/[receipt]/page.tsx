import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import TicketActions from "@/components/ticket/TicketActions";
import { requireDevotee } from "@/lib/devotee/auth";
import { getDonationReceipt } from "@/lib/data/donations";
import { getTempleInfo } from "@/lib/data/temple-info";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const MAROON = "#7a1f1f";
const GOLD = "#b98a3d";
const MUTED = "rgba(42,27,18,0.6)";
const optimized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

// Printable donation receipt — only for the devotee who made it.
export default async function DonationReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; receipt: string }>;
}) {
  const { locale, receipt } = await params;
  setRequestLocale(locale);
  const devotee = await requireDevotee(locale, `/account/donations/${receipt}`);
  const [donation, temple, t, tMeta] = await Promise.all([
    getDonationReceipt(devotee.id, receipt.toUpperCase()),
    getTempleInfo().catch(() => null),
    getTranslations("donate"),
    getTranslations("meta"),
  ]);

  if (!donation) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl text-maroon">{t("receiptNotFound")}</p>
        <Link href="/account?tab=donations" className="mt-6 inline-block text-sm font-semibold text-maroon underline">
          {t("backToDonations")}
        </Link>
      </div>
    );
  }

  const paidOn = new Date(donation.paidAt ?? donation.createdAt).toLocaleString(locale === "kn" ? "kn-IN" : "en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const rows: [string, string][] = [
    [t("receiptNo"), donation.receiptNo],
    [t("date"), paidOn],
    [t("receivedFrom"), donation.donorName],
    [t("phoneLabel"), donation.phone],
    [t("purposeLabel"), t(`purposes.${donation.purpose}`)],
    [t("paymentRef"), donation.paymentId ?? "—"],
    ...(donation.note ? ([[t("noteLabel"), donation.note]] as [string, string][]) : []),
  ];
  const address = temple ? [temple.addressLine1, temple.addressLine2].filter(Boolean).join(", ") : "";
  const contact = temple ? [temple.phone, temple.email].filter(Boolean).join(" · ") : "";

  return (
    <div className="px-4 py-10 sm:px-6">
      <div
        id="temple-ticket"
        className="relative mx-auto w-full max-w-[640px] overflow-hidden"
        style={{ backgroundColor: "#fff", border: `1.5px solid ${MAROON}`, color: "#2a1b12" }}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimized("/images/chakra-watermark.png", 640)} alt="" style={{ width: "60%", opacity: 0.06 }} />
        </div>
        <div className="relative px-6 py-4 text-center" style={{ borderBottom: `3px double ${GOLD}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimized("/images/emblem-full.png", 384)} alt="" className="mx-auto mb-1" style={{ height: 40, width: "auto" }} />
          <p className="font-display text-xl sm:text-2xl" style={{ color: MAROON }}>{tMeta("siteTitle")}</p>
          {address ? <p className="text-xs" style={{ color: MUTED }}>{address}</p> : null}
          {contact ? <p className="text-xs" style={{ color: MUTED }}>{contact}</p> : null}
        </div>
        <div className="relative px-6 py-2 text-center text-sm font-bold" style={{ backgroundColor: MAROON, color: "#fbf1de" }}>
          {t("receiptTitle")}
        </div>
        <div className="relative px-6 py-6">
          <p className="text-center text-sm" style={{ color: MUTED }}>{t("amountReceived")}</p>
          <p className="text-center font-display text-4xl" style={{ color: MAROON }}>₹{donation.amount.toLocaleString("en-IN")}</p>
          <table className="mt-5 w-full border-collapse text-[13px]">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="w-2/5 px-3 py-2 font-semibold" style={{ border: "1px solid rgba(122,31,31,0.25)", color: MUTED, backgroundColor: "rgba(185,138,61,0.10)" }}>
                    {label}
                  </td>
                  <td className="px-3 py-2" style={{ border: "1px solid rgba(122,31,31,0.25)" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-center text-xs" style={{ color: MUTED }}>{t("receiptFootnote")}</p>
        </div>
        <div className="relative px-6 py-2.5 text-center text-xs" style={{ borderTop: `3px double ${GOLD}`, color: MAROON }}>
          {t("thanks")}
        </div>
      </div>
      <TicketActions reference={donation.receiptNo} fileName={`donation-receipt-${donation.receiptNo}`} showKeepLink={false} />
      <p className="mt-3 text-center">
        <Link href="/account?tab=donations" className="text-sm font-semibold text-maroon hover:underline">
          {t("backToDonations")}
        </Link>
      </p>
    </div>
  );
}

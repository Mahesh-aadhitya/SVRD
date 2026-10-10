import "server-only";
import { formatIso } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";
import { nakshatraLabel } from "@/lib/nakshatras";
import type { Ticket } from "@/lib/data/bookings";
import { whatsappOffice } from "./whatsapp";

// WhatsApp messages, in Kannada, to the temple priest: one for every new
// seva booking (with each devotee's gotram and nakshatram for the sankalpa)
// and one when a devotee's UPI payment screenshot is accepted. CallMeBot
// sends text only, so the screenshot goes as a link.

const PAYMENT: Record<Ticket["paymentStatus"], string> = {
  unpaid: "ಪಾವತಿ ಬಾಕಿ",
  submitted: "UPI ಪಾವತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (ಕಚೇರಿ ದೃಢೀಕರಣ ಬಾಕಿ)",
  paid: "ಪಾವತಿಯಾಗಿದೆ",
  refunded: "ಹಣ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ",
};

function header(ticket: Ticket) {
  const date = formatIso(ticket.date, "kn", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return [`*${ticket.sevaName.kn || ticket.sevaName.en}*`, `${date}${ticket.slot ? ` · ${formatSlot(ticket.slot, "kn")}` : ""}`];
}

const amountLine = (ticket: Ticket) =>
  ticket.amount === 0 ? "ಮೊತ್ತ: ಉಚಿತ" : `ಮೊತ್ತ: ₹${ticket.amount.toLocaleString("en-IN")} · ${PAYMENT[ticket.paymentStatus]}`;

export function bookingAlertText(ticket: Ticket, adminUrl: string) {
  const devotees = ticket.devotees.length ? ticket.devotees : [{ name: ticket.devoteeName, gotram: null, nakshatram: null }];
  return [
    "🛕 *ಹೊಸ ಸೇವಾ ಬುಕಿಂಗ್*",
    ...header(ticket),
    "",
    `*ಭಕ್ತರು (${devotees.length})*`,
    ...devotees.map(
      (d, i) =>
        `${i + 1}. ${d.name}\n    ಗೋತ್ರ: ${d.gotram || "—"} · ನಕ್ಷತ್ರ: ${d.nakshatram ? nakshatraLabel(d.nakshatram, "kn") : "—"}`,
    ),
    "",
    `ದೂರವಾಣಿ: ${ticket.phone}`,
    amountLine(ticket),
    `ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ: ${ticket.reference}`,
    adminUrl,
  ].join("\n");
}

export function paymentAlertText(ticket: Ticket, utr: string, screenshotUrl: string | null, adminUrl: string) {
  return [
    "💰 *ಸೇವಾ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ*",
    ...header(ticket),
    `ಭಕ್ತರು: ${ticket.devotees.map((d) => d.name).join(", ") || ticket.devoteeName}`,
    amountLine(ticket),
    `UPI ವಹಿವಾಟು ಸಂಖ್ಯೆ (UTR): ${utr}`,
    `ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ: ${ticket.reference}`,
    ...(screenshotUrl ? ["", "ಪಾವತಿ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ (30 ದಿನ ಲಭ್ಯ):", screenshotUrl] : []),
    "",
    adminUrl,
  ].join("\n");
}

export async function alertOfficeOfBooking(ticket: Ticket, adminUrl: string) {
  await whatsappOffice(bookingAlertText(ticket, adminUrl));
}

export async function alertOfficeOfPayment(ticket: Ticket, utr: string, screenshotUrl: string | null, adminUrl: string) {
  await whatsappOffice(paymentAlertText(ticket, utr, screenshotUrl, adminUrl));
}

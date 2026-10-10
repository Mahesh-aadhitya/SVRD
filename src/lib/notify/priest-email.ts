import "server-only";
import { formatIso } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";
import { nakshatraLabel } from "@/lib/nakshatras";
import type { Ticket } from "@/lib/data/bookings";
import { escapeHtml, FONT, sendTempleMail, templeEmailHtml, templeEmailText, type MailFile } from "@/lib/email/mailer";

// The same alerts the priest gets on WhatsApp, by email in Kannada, to
// PRIEST_EMAIL: every new booking (devotees with gotram and nakshatram,
// payment status) and every accepted UPI payment, with the screenshot
// attached.

const PAYMENT: Record<Ticket["paymentStatus"], string> = {
  unpaid: "ಪಾವತಿ ಬಾಕಿ",
  submitted: "UPI ಪಾವತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (ಕಚೇರಿ ದೃಢೀಕರಣ ಬಾಕಿ)",
  paid: "ಪಾವತಿಯಾಗಿದೆ",
  refunded: "ಹಣ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ",
};

const cell = (i: number) => `padding:9px 12px;${i ? "border-top:1px solid #f1e2be;" : ""}font-family:${FONT.sans};vertical-align:top`;

function details(ticket: Ticket, extra: [string, string][] = []) {
  const seva = ticket.sevaName.kn || ticket.sevaName.en;
  const date = formatIso(ticket.date, "kn", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const devotees = ticket.devotees.length ? ticket.devotees : [{ name: ticket.devoteeName, gotram: null, nakshatram: null }];
  const amount = ticket.amount === 0 ? "ಉಚಿತ" : `₹${ticket.amount.toLocaleString("en-IN")} · ${PAYMENT[ticket.paymentStatus]}`;
  const rows: [string, string][] = [
    ["ಸೇವೆ", seva],
    ["ದಿನಾಂಕ", date],
    ...(ticket.slot ? [["ಸಮಯ", formatSlot(ticket.slot, "kn")] as [string, string]] : []),
    ["ದೂರವಾಣಿ", ticket.phone],
    ["ಮೊತ್ತ", amount],
    ...extra,
    ["ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ", ticket.reference ?? ""],
  ];
  const nak = (d: (typeof devotees)[number]) => (d.nakshatram ? nakshatraLabel(d.nakshatram, "kn") : "—");

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf1de;border:1px solid #e8c97a;border-radius:12px">
        ${rows.map(([l, v], i) => `<tr><td style="${cell(i)}font-size:12px;color:#6b5a4e;white-space:nowrap">${l}</td><td style="${cell(i)}font-size:14px;font-weight:bold;color:#2a1b12">${escapeHtml(v)}</td></tr>`).join("")}
      </table>
      <p style="margin:18px 0 8px;font-weight:bold;color:#7a1f1f">ಭಕ್ತರು (${devotees.length})</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8c97a;border-radius:12px">
        <tr>${["ಹೆಸರು", "ಗೋತ್ರ", "ನಕ್ಷತ್ರ"].map((h) => `<td style="${cell(0)}font-size:12px;color:#6b5a4e;background:#f7ecd6">${h}</td>`).join("")}</tr>
        ${devotees.map((d) => `<tr>${[d.name, d.gotram || "—", nak(d)].map((v) => `<td style="${cell(1)}font-size:14px;color:#2a1b12">${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}
      </table>`;
  const text = [
    ...rows.map(([l, v]) => `${l}: ${v}`),
    "",
    `ಭಕ್ತರು (${devotees.length}):`,
    ...devotees.map((d, i) => `${i + 1}. ${d.name} — ಗೋತ್ರ: ${d.gotram || "—"} · ನಕ್ಷತ್ರ: ${nak(d)}`),
  ];
  return { seva, date, html, text };
}

export function priestBookingEmail(ticket: Ticket) {
  const d = details(ticket);
  return {
    subject: `ಹೊಸ ಸೇವಾ ಬುಕಿಂಗ್: ${d.seva} · ${d.date} (${ticket.reference})`,
    text: templeEmailText("kn", ["ಹೊಸ ಸೇವಾ ಬುಕಿಂಗ್", "", ...d.text]),
    html: templeEmailHtml("kn", `<p style="margin:0 0 14px;font-size:17px;font-weight:bold;color:#7a1f1f">🛕 ಹೊಸ ಸೇವಾ ಬುಕಿಂಗ್</p>${d.html}`),
  };
}

export function priestPaymentEmail(ticket: Ticket, utr: string, hasScreenshot: boolean) {
  const d = details(ticket, [["UPI ವಹಿವಾಟು ಸಂಖ್ಯೆ (UTR)", utr]]);
  const note = hasScreenshot ? "ಭಕ್ತರು ಕಳುಹಿಸಿದ ಪಾವತಿ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಈ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಲಗತ್ತಿಸಲಾಗಿದೆ." : "";
  return {
    subject: `ಸೇವಾ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ: ${d.seva} · ${d.date} (${ticket.reference})`,
    text: templeEmailText("kn", ["ಸೇವಾ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ", "", ...d.text, ...(note ? ["", note] : [])]),
    html: templeEmailHtml(
      "kn",
      `<p style="margin:0 0 14px;font-size:17px;font-weight:bold;color:#7a1f1f">💰 ಸೇವಾ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ</p>${d.html}${note ? `<p style="margin:16px 0 0;font-size:14px;color:#4f1414">📎 ${note}</p>` : ""}`,
    ),
  };
}

const priest = () => process.env.PRIEST_EMAIL;

export async function emailPriestOfBooking(ticket: Ticket) {
  const to = priest();
  if (to) await sendTempleMail({ to, ...priestBookingEmail(ticket) });
}

export async function emailPriestOfPayment(ticket: Ticket, utr: string, screenshot: MailFile | null) {
  const to = priest();
  if (to) await sendTempleMail({ to, ...priestPaymentEmail(ticket, utr, !!screenshot), files: screenshot ? [screenshot] : [] });
}

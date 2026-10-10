import "server-only";
import { formatIso } from "@/lib/dates";
import { formatSlot } from "@/lib/seva-types";
import type { Ticket } from "@/lib/data/bookings";
import { escapeHtml, FONT, langOf, sendTempleMail, templeEmailHtml, templeEmailText } from "./mailer";

// Sent right after a seva is booked: the details, what's left to do about
// payment, and the signed link to the ticket page (QR, download, print).

const COPY = {
  en: {
    subject: (seva: string, date: string, ref: string) => `Seva booked: ${seva} on ${date} (Ref ${ref})`,
    greeting: (name: string) => `Namaskaram ${name},`,
    booked: "Your seva booking has been received. Here are the details:",
    labels: { seva: "Seva", date: "Date", time: "Time", devotees: "Devotees", amount: "Amount", ref: "Booking ref" },
    free: "Free",
    payPending: "Payment pending — open your ticket to pay by UPI, or pay at the temple counter before the seva.",
    paySubmitted: "We have your payment details; the temple office will confirm them shortly.",
    confirmed: "Show the QR code on your ticket at the temple counter.",
    cta: "View & download ticket",
    keep: "Keep this email: the button above always opens your ticket.",
  },
  kn: {
    subject: (seva: string, date: string, ref: string) => `ಸೇವೆ ಬುಕ್ ಆಗಿದೆ: ${seva}, ${date} (ಸಂಖ್ಯೆ ${ref})`,
    greeting: (name: string) => `ನಮಸ್ಕಾರ ${name},`,
    booked: "ನಿಮ್ಮ ಸೇವಾ ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ವಿವರಗಳು ಇಲ್ಲಿವೆ:",
    labels: { seva: "ಸೇವೆ", date: "ದಿನಾಂಕ", time: "ಸಮಯ", devotees: "ಭಕ್ತರು", amount: "ಮೊತ್ತ", ref: "ಬುಕಿಂಗ್ ಸಂಖ್ಯೆ" },
    free: "ಉಚಿತ",
    payPending: "ಪಾವತಿ ಬಾಕಿ ಇದೆ — ಟಿಕೆಟ್ ತೆರೆದು UPI ಮೂಲಕ ಪಾವತಿಸಿ, ಅಥವಾ ಸೇವೆಗೆ ಮುನ್ನ ದೇವಸ್ಥಾನದ ಕೌಂಟರ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ.",
    paySubmitted: "ನಿಮ್ಮ ಪಾವತಿ ವಿವರ ತಲುಪಿದೆ; ದೇವಸ್ಥಾನದ ಕಚೇರಿ ಶೀಘ್ರದಲ್ಲೇ ದೃಢೀಕರಿಸುತ್ತದೆ.",
    confirmed: "ದೇವಸ್ಥಾನದ ಕೌಂಟರ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಟಿಕೆಟ್‌ನ QR ಕೋಡ್ ತೋರಿಸಿ.",
    cta: "ಟಿಕೆಟ್ ನೋಡಿ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    keep: "ಈ ಇಮೇಲ್ ಉಳಿಸಿಕೊಳ್ಳಿ: ಮೇಲಿನ ಬಟನ್ ಯಾವಾಗಲೂ ನಿಮ್ಮ ಟಿಕೆಟ್ ತೆರೆಯುತ್ತದೆ.",
  },
};

export function bookingEmail(ticket: Ticket, ticketUrl: string, locale: string) {
  const lang = langOf(locale);
  const c = COPY[lang];
  const ref = ticket.reference ?? "";
  const seva = ticket.sevaName[lang] || ticket.sevaName.en;
  const date = formatIso(ticket.date, lang, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const names = ticket.devotees.length ? ticket.devotees.map((d) => d.name).join(", ") : ticket.devoteeName;
  const amount = ticket.amount > 0 ? `₹${ticket.amount.toLocaleString("en-IN")}` : c.free;
  const payment =
    ticket.amount > 0 && ticket.paymentStatus === "unpaid"
      ? c.payPending
      : ticket.amount > 0 && ticket.paymentStatus === "submitted"
        ? c.paySubmitted
        : c.confirmed;
  const rows: [string, string][] = [
    [c.labels.seva, seva],
    [c.labels.date, date],
    ...(ticket.slot ? [[c.labels.time, formatSlot(ticket.slot, lang)] as [string, string]] : []),
    [c.labels.devotees, names],
    [c.labels.amount, amount],
    [c.labels.ref, ref],
  ];

  const content = `<p style="margin:0 0 8px">${escapeHtml(c.greeting(ticket.devoteeName))}</p>
      <p style="margin:0 0 14px">${c.booked}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf1de;border:1px solid #e8c97a;border-radius:12px">
        ${rows
          .map(
            ([label, value], i) => `<tr>
          <td style="padding:9px 14px;${i ? "border-top:1px solid #f1e2be;" : ""}font-family:${FONT.sans};font-size:12px;color:#6b5a4e;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:9px 14px;${i ? "border-top:1px solid #f1e2be;" : ""}font-family:${FONT.sans};font-size:14px;color:#2a1b12;font-weight:bold">${escapeHtml(value)}</td>
        </tr>`,
          )
          .join("")}
      </table>
      <p style="margin:14px 0 0;font-size:14px;color:#4f1414">${payment}</p>
      <div style="text-align:center;padding:20px 0 4px">
        <a href="${escapeHtml(ticketUrl)}" style="display:inline-block;background:#7a1f1f;color:#fbf1de;text-decoration:none;font-family:${FONT.sans};font-size:15px;font-weight:bold;border-radius:999px;padding:13px 28px">${c.cta}</a>
        <div style="margin-top:10px;font-family:${FONT.sans};font-size:12px;color:#6b5a4e">${c.keep}</div>
      </div>`;

  return {
    subject: c.subject(seva, date, ref),
    text: templeEmailText(lang, [
      c.greeting(ticket.devoteeName),
      "",
      c.booked,
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
      "",
      payment,
      "",
      `${c.cta}: ${ticketUrl}`,
    ]),
    html: templeEmailHtml(lang, content),
  };
}

export async function emailBookingConfirmation(to: string, ticket: Ticket, ticketUrl: string, locale: string) {
  await sendTempleMail({ to, ...bookingEmail(ticket, ticketUrl, locale) });
}

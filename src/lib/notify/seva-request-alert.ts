import "server-only";
import { formatIso } from "@/lib/dates";
import { nakshatraLabel } from "@/lib/nakshatras";
import type { SevaRequest } from "@/lib/seva-requests/types";
import { escapeHtml, FONT, langOf, sendTempleMail, templeEmailHtml, templeEmailText, type Lang } from "@/lib/email/mailer";
import { whatsappOffice } from "./whatsapp";

// A devotee asked for a seva on a day of their choosing. The priest hears
// about it on WhatsApp and by email (Kannada) and calls them back; the
// devotee gets a copy of what they asked for, in their language.

const OCCASION: Record<Lang, Record<string, string>> = {
  en: { birthday: "Birthday", anniversary: "Wedding anniversary", remembrance: "Remembrance (tithi)", beginning: "New beginning", other: "Other" },
  kn: { birthday: "ಹುಟ್ಟುಹಬ್ಬ", anniversary: "ವಿವಾಹ ವಾರ್ಷಿಕೋತ್ಸವ", remembrance: "ಸ್ಮರಣೆ (ತಿಥಿ)", beginning: "ಹೊಸ ಆರಂಭ", other: "ಇತರೆ" },
};

const LABELS = {
  en: { seva: "Seva", date: "Day requested", occasion: "Occasion", phone: "Mobile", ref: "Request no.", note: "Note", devotees: "Devotees", name: "Name", gotram: "Gotram", nakshatram: "Nakshatram" },
  kn: { seva: "ಸೇವೆ", date: "ಕೋರಿದ ದಿನ", occasion: "ಸಂದರ್ಭ", phone: "ಮೊಬೈಲ್", ref: "ವಿನಂತಿ ಸಂಖ್ಯೆ", note: "ಟಿಪ್ಪಣಿ", devotees: "ಭಕ್ತರು", name: "ಹೆಸರು", gotram: "ಗೋತ್ರ", nakshatram: "ನಕ್ಷತ್ರ" },
};

function parts(r: SevaRequest, lang: Lang) {
  const l = LABELS[lang];
  const date = formatIso(r.requestedDate, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const occasion = r.occasion ? OCCASION[lang][r.occasion] ?? r.occasion : "";
  const seva = r.sevaTitle ? r.sevaTitle[lang] || r.sevaTitle.en : r.sevaName;
  const rows: [string, string][] = [
    [l.seva, seva],
    [l.date, date],
    ...(occasion ? [[l.occasion, occasion] as [string, string]] : []),
    [l.phone, r.phone],
    [l.ref, r.reference],
    ...(r.note ? [[l.note, r.note] as [string, string]] : []),
  ];
  const nak = (d: SevaRequest["devotees"][number]) => (d.nakshatram ? nakshatraLabel(d.nakshatram, lang) : "—");
  const cell = (i: number) => `padding:9px 12px;${i ? "border-top:1px solid #f1e2be;" : ""}font-family:${FONT.sans};vertical-align:top`;
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf1de;border:1px solid #e8c97a;border-radius:12px">
        ${rows.map(([k, v], i) => `<tr><td style="${cell(i)}font-size:12px;color:#6b5a4e;white-space:nowrap">${k}</td><td style="${cell(i)}font-size:14px;font-weight:bold;color:#2a1b12">${escapeHtml(v)}</td></tr>`).join("")}
      </table>
      <p style="margin:18px 0 8px;font-weight:bold;color:#7a1f1f">${l.devotees} (${r.devotees.length})</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8c97a;border-radius:12px">
        <tr>${[l.name, l.gotram, l.nakshatram].map((h) => `<td style="${cell(0)}font-size:12px;color:#6b5a4e;background:#f7ecd6">${h}</td>`).join("")}</tr>
        ${r.devotees.map((d) => `<tr>${[d.name, d.gotram || "—", nak(d)].map((v) => `<td style="${cell(1)}font-size:14px;color:#2a1b12">${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}
      </table>`;
  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `${l.devotees} (${r.devotees.length}):`,
    ...r.devotees.map((d, i) => `${i + 1}. ${d.name} — ${l.gotram}: ${d.gotram || "—"} · ${l.nakshatram}: ${nak(d)}`),
  ];
  return { seva, date, html, text };
}

export function requestWhatsappText(r: SevaRequest, adminUrl: string) {
  const p = parts(r, "kn");
  return [
    "🙏 *ವಿಶೇಷ ದಿನದ ಸೇವಾ ವಿನಂತಿ*",
    "ಭಕ್ತರಿಗೆ ಕರೆ ಮಾಡಿ ದೃಢೀಕರಿಸಿ.",
    "",
    ...p.text,
    "",
    adminUrl,
  ].join("\n");
}

export function priestRequestEmail(r: SevaRequest) {
  const p = parts(r, "kn");
  return {
    subject: `ಸೇವಾ ವಿನಂತಿ: ${p.seva} · ${p.date} (${r.reference})`,
    text: templeEmailText("kn", ["ವಿಶೇಷ ದಿನದ ಸೇವಾ ವಿನಂತಿ — ಭಕ್ತರಿಗೆ ಕರೆ ಮಾಡಿ ದೃಢೀಕರಿಸಿ.", "", ...p.text]),
    html: templeEmailHtml(
      "kn",
      `<p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:#7a1f1f">🙏 ವಿಶೇಷ ದಿನದ ಸೇವಾ ವಿನಂತಿ</p>
      <p style="margin:0 0 14px;font-size:14px;color:#4f1414">ಭಕ್ತರಿಗೆ <strong>${escapeHtml(r.phone)}</strong> ಗೆ ಕರೆ ಮಾಡಿ ದೃಢೀಕರಿಸಿ.</p>${p.html}`,
    ),
  };
}

const DEVOTEE = {
  en: {
    subject: (seva: string, date: string) => `Seva request received: ${seva} on ${date}`,
    greeting: (name: string) => `Namaskaram ${name},`,
    body: "We have received your request. Our priest will call you to confirm the seva and the offering. Here is what you asked for:",
  },
  kn: {
    subject: (seva: string, date: string) => `ಸೇವಾ ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ: ${seva}, ${date}`,
    greeting: (name: string) => `ನಮಸ್ಕಾರ ${name},`,
    body: "ನಿಮ್ಮ ವಿನಂತಿ ತಲುಪಿದೆ. ಸೇವೆ ಮತ್ತು ಕಾಣಿಕೆ ದೃಢೀಕರಿಸಲು ನಮ್ಮ ಅರ್ಚಕರು ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತಾರೆ. ನೀವು ಕೋರಿದ ವಿವರ:",
  },
};

export function devoteeRequestEmail(r: SevaRequest) {
  const lang = langOf(r.locale);
  const c = DEVOTEE[lang];
  const p = parts(r, lang);
  const name = r.devotees[0]?.name ?? "";
  return {
    subject: c.subject(p.seva, p.date),
    text: templeEmailText(lang, [c.greeting(name), "", c.body, "", ...p.text]),
    html: templeEmailHtml(lang, `<p style="margin:0 0 8px">${escapeHtml(c.greeting(name))}</p><p style="margin:0 0 14px">${c.body}</p>${p.html}`),
  };
}

// Each one on its own: one failing doesn't stop the others.
export async function notifySevaRequest(r: SevaRequest, adminUrl: string) {
  const priest = process.env.PRIEST_EMAIL;
  await Promise.all([
    whatsappOffice(requestWhatsappText(r, adminUrl)).catch((e) => console.error("request WhatsApp alert:", e)),
    priest ? sendTempleMail({ to: priest, ...priestRequestEmail(r) }).catch((e) => console.error("request priest email:", e)) : null,
    r.email ? sendTempleMail({ to: r.email, ...devoteeRequestEmail(r) }).catch((e) => console.error("request devotee email:", e)) : null,
  ]);
}

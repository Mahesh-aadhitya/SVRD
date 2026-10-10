import "server-only";
import nodemailer from "nodemailer";
import { CHAKRA_LOGO_PNG } from "./chakra-logo";

// Every email the site sends — sign-in codes, booking confirmations — goes
// out from the temple's Gmail as "Sri Varada Sandesham", in one layout:
// the Chakra, the invocation, the message, a blessing and a do-not-reply
// footer.
//
// Needs GMAIL_USER and GMAIL_APP_PASSWORD — a 16-letter Google App Password
// (Google Account → Security → 2-Step Verification → App passwords), never
// the Gmail password itself. Without them, development prints the email to
// the server console instead.
//
// Plain, personal-looking mail keeps Gmail's spam filter calm: a full HTML
// document with a matching text part, one small inline image, few links,
// and the headers automated mail is expected to carry.

export type Lang = "en" | "kn";
export const langOf = (locale: string): Lang => (locale === "kn" ? "kn" : "en");

export const SENDER = "Sri Varada Sandesham";
export const TEMPLE = { en: "Sri Varadaraja Swamy Devasthaanam", kn: "ಶ್ರೀ ವರದರಾಜ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ" };

const COMMON = {
  en: {
    invocation: "Jai Sreemannarayana",
    blessing: "May Sri Varadaraja Swamy bless you and your family.",
    noReply: "This is an automated message — please do not reply to this email.",
  },
  kn: {
    invocation: "ಜೈ ಶ್ರೀಮನ್ನಾರಾಯಣ",
    blessing: "ಶ್ರೀ ವರದರಾಜ ಸ್ವಾಮಿಯ ಆಶೀರ್ವಾದ ನಿಮ್ಮ ಹಾಗೂ ನಿಮ್ಮ ಕುಟುಂಬದ ಮೇಲಿರಲಿ.",
    noReply: "ಇದು ಸ್ವಯಂಚಾಲಿತ ಸಂದೇಶ — ದಯವಿಟ್ಟು ಈ ಇಮೇಲ್‌ಗೆ ಉತ್ತರಿಸಬೇಡಿ.",
  },
};

export const FONT = {
  sans: "'Noto Sans Kannada','Segoe UI',Arial,Helvetica,sans-serif",
  serif: "Georgia,'Times New Roman',serif",
};

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The shared frame. `content` is ready HTML (table rows' cell contents),
// `footerNote` a line under the do-not-reply notice.
export function templeEmailHtml(lang: Lang, content: string, footerNote = "") {
  const c = COMMON[lang];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SENDER}</title>
</head>
<body style="margin:0;padding:0;background:#fbf1de">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf1de;padding:28px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fffdf7;border:1px solid #e8c97a;border-radius:18px;overflow:hidden">
    <tr><td style="height:5px;background:#b98a3d;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td align="center" style="padding:26px 24px 6px">
      <img src="cid:chakra@varada" width="58" height="69" alt="" style="display:block;border:0">
      <div style="margin-top:12px;font-family:${FONT.sans};font-size:${lang === "en" ? "11px;letter-spacing:2px;text-transform:uppercase" : "13px"};color:#b98a3d;font-weight:bold">${c.invocation}</div>
      <div style="margin-top:4px;font-family:${FONT.serif};font-size:26px;color:#7a1f1f">${SENDER}</div>
      <div style="margin-top:2px;font-family:${FONT.sans};font-size:13px;color:#6b5a4e">${TEMPLE[lang]}</div>
      <div style="margin-top:14px;font-family:${FONT.serif};font-size:14px;color:#b98a3d;letter-spacing:6px">&#10022; &#10022; &#10022;</div>
    </td></tr>
    <tr><td style="padding:10px 28px 6px;font-family:${FONT.sans};font-size:15px;line-height:1.6;color:#2a1b12">
      ${content}
    </td></tr>
    <tr><td align="center" style="padding:14px 28px 24px;font-family:${FONT.serif};font-size:15px;font-style:italic;line-height:1.5;color:#7a1f1f">${c.blessing}</td></tr>
    <tr><td style="background:#f7ecd6;border-top:1px solid #e8c97a;padding:16px 24px;text-align:center;font-family:${FONT.sans};font-size:12px;line-height:1.6;color:#6b5a4e">
      <strong style="color:#4f1414">${c.noReply}</strong>${footerNote ? `<br>${footerNote}` : ""}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

// The text part, framed the same way.
export function templeEmailText(lang: Lang, lines: string[], footerNote = "") {
  const c = COMMON[lang];
  return [c.invocation, SENDER, TEMPLE[lang], "", ...lines, "", c.blessing, "", "—", c.noReply, footerNote].filter((l, i, all) => l || all[i - 1]).join("\n");
}

export type MailFile = { filename: string; content: Buffer; contentType: string };

export async function sendTempleMail(mail: { to: string; subject: string; text: string; html: string; files?: MailFile[] }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set");
    console.warn(`[dev] email to ${mail.to}: ${mail.subject}\n${mail.text}\n(set GMAIL_USER and GMAIL_APP_PASSWORD to send it)`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    name: "varadaraja.vercel.app",
  });
  await transport.sendMail({
    from: { name: SENDER, address: user },
    to: mail.to,
    subject: mail.subject,
    messageId: `<${crypto.randomUUID()}@gmail.com>`,
    headers: { "Auto-Submitted": "auto-generated", "X-Auto-Response-Suppress": "All" },
    text: mail.text,
    html: mail.html,
    attachments: [
      { filename: "chakra.png", content: CHAKRA_LOGO_PNG, encoding: "base64", cid: "chakra@varada", contentDisposition: "inline" },
      ...(mail.files ?? []),
    ],
  });
}

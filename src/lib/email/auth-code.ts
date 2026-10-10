import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { FONT, langOf, sendTempleMail, templeEmailHtml, templeEmailText } from "./mailer";

// Sign-in codes go out from the temple's own Gmail (see ./mailer), not
// Supabase's mailer: Supabase only makes the code (auth.admin.generateLink
// returns it without sending anything) and later checks it (verifyOtp).

export type CodePurpose = "signup" | "recovery";

const COPY = {
  en: {
    subject: { signup: (code: string) => `${code} is your sign-up code`, recovery: (code: string) => `${code} is your password reset code` },
    greeting: "Namaskaram,",
    intro: {
      signup: "Use this code to confirm your email and finish creating your account with the temple:",
      recovery: "Use this code to choose a new password for your temple account:",
    },
    once: "Only the newest code works, and only once.",
    ignore: "If you didn't ask for this code, you can safely ignore this email.",
  },
  kn: {
    subject: { signup: (code: string) => `${code} – ನಿಮ್ಮ ನೋಂದಣಿ ಕೋಡ್`, recovery: (code: string) => `${code} – ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸುವ ಕೋಡ್` },
    greeting: "ನಮಸ್ಕಾರ,",
    intro: {
      signup: "ನಿಮ್ಮ ಇಮೇಲ್ ದೃಢೀಕರಿಸಿ ದೇವಸ್ಥಾನದ ಖಾತೆ ತೆರೆಯಲು ಈ ಕೋಡ್ ಬಳಸಿ:",
      recovery: "ನಿಮ್ಮ ದೇವಸ್ಥಾನದ ಖಾತೆಗೆ ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಲು ಈ ಕೋಡ್ ಬಳಸಿ:",
    },
    once: "ಇತ್ತೀಚಿನ ಕೋಡ್ ಮಾತ್ರ, ಒಮ್ಮೆ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ.",
    ignore: "ನೀವು ಈ ಕೋಡ್ ಕೇಳಿಲ್ಲದಿದ್ದರೆ ಈ ಇಮೇಲ್ ಅನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ.",
  },
};

// At most one code a minute and five an hour to any one address, so the
// form can't be used to flood someone's inbox or spend the Gmail quota.
export async function mayEmailCode(email: string) {
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data, error } = await createAdminClient()
    .from("email_code_sends")
    .select("sent_at")
    .eq("email", email)
    .gte("sent_at", hourAgo)
    .order("sent_at", { ascending: false });
  if (error) throw new Error(`email_code_sends: ${error.message}`);
  if (!data.length) return true;
  return data.length < 5 && Date.now() - Date.parse(data[0].sent_at) > 60_000;
}

export function codeEmail(code: string, purpose: CodePurpose, locale: string) {
  const lang = langOf(locale);
  const c = COPY[lang];
  const content = `<p style="margin:0 0 8px">${c.greeting}</p>
      <p style="margin:0">${c.intro[purpose]}</p>
      <div style="text-align:center;padding:18px 0 4px">
        <div style="display:inline-block;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:10px;color:#7a1f1f;background:#fbf1de;border:1px dashed #b98a3d;border-radius:12px;padding:14px 18px 14px 28px">${code}</div>
        <div style="margin-top:10px;font-family:${FONT.sans};font-size:12px;color:#6b5a4e">${c.once}</div>
      </div>`;
  return {
    subject: c.subject[purpose](code),
    text: templeEmailText(lang, [c.greeting, "", c.intro[purpose], "", `    ${code}`, "", c.once], c.ignore),
    html: templeEmailHtml(lang, content, c.ignore),
  };
}

export async function emailCode(to: string, code: string, purpose: CodePurpose, locale: string) {
  await sendTempleMail({ to, ...codeEmail(code, purpose, locale) });
  const admin = createAdminClient();
  await admin.from("email_code_sends").insert({ email: to });
  // Keep the table small: a day's history is all the limit needs.
  await admin.from("email_code_sends").delete().lt("sent_at", new Date(Date.now() - 86_400_000).toISOString());
}

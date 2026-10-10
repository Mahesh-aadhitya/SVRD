"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fieldClass } from "@/components/booking/DevoteeFields";
import {
  requestPasswordReset,
  resendEmailCode,
  resetPasswordWithCode,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailCode,
  type AuthResult,
  type AuthStep,
} from "@/lib/actions/auth";

// Email + password sign-in / sign-up, with the emailed code for
// confirming a new account, or — with a new password on the same screen —
// resetting a forgotten one. `next` is a
// path without the locale prefix; the server redirect adds it.
export default function EmailAuthPanel({ next }: { next: string }) {
  const t = useTranslations("auth.email");
  const locale = useLocale();
  const [step, setStep] = useState<AuthStep>("signin");
  const [purpose, setPurpose] = useState<"signup" | "recovery">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<AuthResult>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) return setError(t(`errors.${r.error}`));
      if (r.email) setEmail(r.email);
      if (r.purpose) setPurpose(r.purpose);
      if (r.step) {
        setStep(r.step);
        setCode("");
        if (r.purpose === "recovery") setPassword("");
      }
      if (r.message) setNotice(t(`messages.${r.message}`, { email: r.email ?? email }));
    });
  }

  const go = (s: AuthStep) => {
    setStep(s);
    setError(null);
    setNotice(null);
  };

  const label = "block text-sm font-medium text-ink/70";
  const primary =
    "h-11 w-full rounded-full bg-maroon text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60";
  const link = "font-semibold text-maroon hover:underline";

  const passwordField = (id: string, autoComplete: string, labelText: string) => (
    <div>
      <label className={label} htmlFor={id}>{labelText}</label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required
          minLength={step === "signin" ? 1 : 8}
          maxLength={72}
          autoComplete={autoComplete}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${fieldClass} pr-16`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs font-semibold text-maroon/70 hover:text-maroon"
        >
          {showPassword ? t("hide") : t("show")}
        </button>
      </div>
      {step !== "signin" ? <p className="mt-1 text-xs text-ink/50">{t("passwordHint")}</p> : null}
    </div>
  );

  return (
    <div>
      {step === "signin" || step === "signup" ? (
        <div className="mb-5 grid grid-cols-2 rounded-full bg-black/[0.04] p-1 text-sm font-semibold">
          {(["signin", "signup"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              className={`rounded-full py-2 transition ${step === s ? "bg-white text-maroon shadow-sm" : "text-ink/55 hover:text-maroon"}`}
            >
              {t(`tabs.${s}`)}
            </button>
          ))}
        </div>
      ) : null}

      {step === "signin" ? (
        <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), run(() => signInWithEmail(locale, next, { email, password })))}>
          <div>
            <label className={label} htmlFor="auth-email">{t("email")}</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </div>
          {passwordField("auth-password", "current-password", t("password"))}
          <div className="text-right text-xs">
            <button type="button" className={link} onClick={() => go("forgot")}>{t("forgot")}</button>
          </div>
          <button disabled={pending} className={primary}>{pending ? t("working") : t("signInCta")}</button>
        </form>
      ) : step === "signup" ? (
        <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), run(() => signUpWithEmail(locale, { name, email, password })))}>
          <div>
            <label className={label} htmlFor="auth-name">{t("name")}</label>
            <input id="auth-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={label} htmlFor="auth-email">{t("email")}</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </div>
          {passwordField("auth-new-password", "new-password", t("createPassword"))}
          <button disabled={pending} className={primary}>{pending ? t("working") : t("signUpCta")}</button>
          <p className="text-center text-xs text-ink/50">{t("signUpNote")}</p>
        </form>
      ) : step === "verify" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => (
            e.preventDefault(),
            run(() =>
              purpose === "recovery"
                ? resetPasswordWithCode(locale, next, { email, code, password })
                : verifyEmailCode(locale, next, { email, code }),
            )
          )}
        >
          <div className="text-center">
            <p className="font-display text-xl text-maroon">{t(purpose === "recovery" ? "verifyResetTitle" : "verifyTitle")}</p>
            <p className="mt-1 text-sm text-ink/65">{t("verifyBody", { email })}</p>
          </div>
          <input
            aria-label={t("code")}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className={`${fieldClass} h-14 text-center font-mono text-2xl tracking-[0.5em]`}
          />
          {purpose === "recovery" ? passwordField("auth-reset-password", "new-password", t("newPassword")) : null}
          <button disabled={pending || code.length < 6} className={primary}>
            {pending ? t("working") : t(purpose === "recovery" ? "resetCta" : "verifyCta")}
          </button>
          <div className="flex justify-between text-xs">
            <button type="button" className={link} onClick={() => go(purpose === "recovery" ? "forgot" : "signup")}>
              ← {t("changeEmail")}
            </button>
            <button type="button" className={link} disabled={pending} onClick={() => run(() => resendEmailCode(locale, { email, purpose }))}>
              {t("resend")}
            </button>
          </div>
        </form>
      ) : step === "forgot" ? (
        <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), run(() => requestPasswordReset(locale, { email })))}>
          <div className="text-center">
            <p className="font-display text-xl text-maroon">{t("forgotTitle")}</p>
            <p className="mt-1 text-sm text-ink/65">{t("forgotBody")}</p>
          </div>
          <div>
            <label className={label} htmlFor="auth-email">{t("email")}</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </div>
          <button disabled={pending} className={primary}>{pending ? t("working") : t("sendCode")}</button>
          <p className="text-center text-xs">
            <button type="button" className={link} onClick={() => go("signin")}>← {t("backToSignIn")}</button>
          </p>
        </form>
      ) : null}

      {notice ? <p className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm text-green-800">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

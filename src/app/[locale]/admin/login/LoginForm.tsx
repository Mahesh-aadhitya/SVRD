"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { login } from "./actions";

export default function LoginForm() {
  const t = useTranslations("admin.login");
  const locale = useLocale() as Locale;
  const loginWithLocale = login.bind(null, locale);
  const [state, formAction, pending] = useActionState(loginWithLocale, undefined);

  return (
    <form
      action={formAction}
      className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-black/[0.03] p-6"
    >
      <p className="font-display text-xl text-maroon">{t("title")}</p>
      <p className="mt-1 text-sm text-ink/60">{t("subtitle")}</p>

      <div className="mt-6">
        <label className="text-sm font-medium text-ink/70" htmlFor="email">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-ink/70" htmlFor="password">
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {t("invalidCredentials")}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-maroon-dark hover:brightness-105 disabled:opacity-60"
      >
        {t("submitCta")}
      </button>
    </form>
  );
}

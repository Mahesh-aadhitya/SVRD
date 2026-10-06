"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { findTicket } from "@/lib/actions/bookings";

const inputClass = "mt-1 w-full rounded-xl border border-gold/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-maroon";

export default function FindTicketForm() {
  const t = useTranslations("ticket");
  const locale = useLocale();
  const [state, action, pending] = useActionState(findTicket.bind(null, locale), undefined);

  return (
    <form action={action} className="rounded-2xl border border-gold/30 bg-white/80 p-6 shadow-sm">
      <p className="font-display text-2xl text-maroon">{t("findTitle")}</p>
      <p className="mt-1 text-sm text-ink/60">{t("findSubtitle")}</p>
      <label className="mt-5 block text-sm font-medium text-ink/70" htmlFor="reference">
        {t("reference")}
      </label>
      <input
        id="reference"
        name="reference"
        required
        maxLength={8}
        autoCapitalize="characters"
        className={`${inputClass} font-mono uppercase tracking-widest`}
      />
      <label className="mt-4 block text-sm font-medium text-ink/70" htmlFor="phone">
        {t("phoneUsed")}
      </label>
      <input id="phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} />
      {state?.error ? <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{t("findNotFound")}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
      >
        {pending ? "…" : t("findCta")}
      </button>
    </form>
  );
}

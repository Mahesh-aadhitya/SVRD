"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { claimBooking } from "@/lib/actions/account";
import { fieldClass } from "@/components/booking/DevoteeFields";

// "Booked before signing in?" — reference + mobile number adds it here.
export default function ClaimBookingForm() {
  const t = useTranslations("account");
  const [state, action, pending] = useActionState(claimBooking, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-36 flex-1">
        <label className="block text-xs font-medium text-ink/70" htmlFor="claim-ref">{t("claimReference")}</label>
        <input id="claim-ref" name="reference" required maxLength={8} className={`${fieldClass} font-mono uppercase tracking-widest`} />
      </div>
      <div className="min-w-40 flex-1">
        <label className="block text-xs font-medium text-ink/70" htmlFor="claim-phone">{t("claimPhone")}</label>
        <input id="claim-phone" name="phone" type="tel" required className={fieldClass} />
      </div>
      <button disabled={pending} className="h-11 rounded-full border border-maroon/40 px-5 text-sm font-semibold text-maroon hover:bg-maroon/5 disabled:opacity-60">
        {t("claimCta")}
      </button>
      {state?.claimed ? <p className="w-full text-sm text-green-700">{t("claimed", { reference: state.claimed })}</p> : null}
      {state?.error ? <p className="w-full text-sm text-red-700">{t(`claimErrors.${state.error}`)}</p> : null}
    </form>
  );
}

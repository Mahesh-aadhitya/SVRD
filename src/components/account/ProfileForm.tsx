"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/account";
import { fieldClass } from "@/components/booking/DevoteeFields";
import { NAKSHATRAS } from "@/lib/nakshatras";
import type { DevoteeProfile } from "@/lib/devotee/types";

export default function ProfileForm({ profile }: { profile: DevoteeProfile }) {
  const t = useTranslations("account");
  const tDev = useTranslations("booking.devotee");
  const locale = useLocale();
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const label = "block text-sm font-medium text-ink/70";

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={label} htmlFor="fullName">{tDev("name")}</label>
        <input id="fullName" name="fullName" required minLength={2} maxLength={100} defaultValue={profile.fullName} className={fieldClass} />
      </div>
      <div>
        <label className={label} htmlFor="email">{t("email")}</label>
        <input id="email" value={profile.email} disabled className={`${fieldClass} bg-black/[0.03] text-ink/60`} />
      </div>
      <div>
        <label className={label} htmlFor="phone">{t("phone")}</label>
        <input id="phone" name="phone" type="tel" pattern="[0-9+ \-]{10,16}" defaultValue={profile.phone} className={fieldClass} />
      </div>
      <div>
        <label className={label} htmlFor="gotram">
          {tDev("gotram")} <span className="font-normal text-ink/40">({tDev("optional")})</span>
        </label>
        <input id="gotram" name="gotram" maxLength={60} defaultValue={profile.gotram ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className={label} htmlFor="nakshatram">
          {tDev("nakshatram")} <span className="font-normal text-ink/40">({tDev("optional")})</span>
        </label>
        <select id="nakshatram" name="nakshatram" defaultValue={profile.nakshatram ?? ""} className={fieldClass}>
          <option value="">—</option>
          {NAKSHATRAS.map((n) => (
            <option key={n.key} value={n.key}>
              {locale === "kn" ? `${n.kn} (${n.key})` : n.key}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button disabled={pending} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
          {pending ? t("saving") : t("save")}
        </button>
        {state?.saved ? <span className="text-sm text-green-700">{t("saved")}</span> : null}
        {state?.error ? <span className="text-sm text-red-700">{t(`errors.${state.error}`)}</span> : null}
      </div>
    </form>
  );
}

"use client";

import { useTranslations } from "next-intl";

export default function LiveComments() {
  const t = useTranslations("live");

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-white/50 p-5 text-center text-sm text-ink/60">
      {t("commentsPlaceholder")}
    </div>
  );
}

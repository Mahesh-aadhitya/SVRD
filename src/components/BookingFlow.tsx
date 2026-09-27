"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { sevas } from "@/lib/placeholder-data";
import ChakraSpinner from "@/components/ChakraSpinner";
import type { Locale } from "@/i18n/routing";

function nextDates(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingFlow() {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const preselected = searchParams.get("seva");

  const [step, setStep] = useState(1);
  const [sevaId, setSevaId] = useState<string | null>(preselected);
  const [date, setDate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dates = useMemo(() => nextDates(14), []);
  const seva = sevas.find((s) => s.id === sevaId) ?? sevas[0];

  if (submitting) {
    return <ChakraSpinner label={`${t("confirmCta")}…`} />;
  }

  if (confirmed) {
    return (
      <div className="mt-8 rounded-2xl border border-gold/30 bg-white/70 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon text-cream">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        </div>
        <p className="mt-4 font-display text-2xl text-maroon">{seva.name[locale]}</p>
        <p className="mt-1 text-sm text-ink/70">
          {date} &middot; {name} &middot; {phone}
        </p>
        <p className="mt-4 rounded-xl bg-cream-dark px-4 py-3 text-xs text-ink/60">
          {t("comingSoonNote")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <StepIndicator step={step} />

      {step === 1 ? (
        <div className="mt-6 space-y-3">
          {sevas.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSevaId(s.id);
                setStep(2);
              }}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
                sevaId === s.id
                  ? "border-maroon bg-cream-dark"
                  : "border-gold/25 bg-white/60 hover:border-maroon/40"
              }`}
            >
              <div>
                <p className="font-display text-lg text-maroon">{s.name[locale]}</p>
                <p className="mt-1 text-sm text-ink/65">{s.description[locale]}</p>
              </div>
              <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-maroon-dark">
                {s.price === 0 ? t("priceFree") : `₹${s.price}`}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-ink/70">{t("selectDate")}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const label = d.toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const full = seva.capacityPerSlot <= 1 && d.getDay() === 0;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={full}
                  onClick={() => {
                    setDate(iso);
                    setStep(3);
                  }}
                  className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-4 py-3 text-xs font-medium transition-colors ${
                    date === iso
                      ? "border-maroon bg-maroon text-cream"
                      : full
                        ? "cursor-not-allowed border-gold/15 bg-cream-dark text-ink/30"
                        : "border-gold/25 bg-white/60 text-ink/70 hover:border-maroon/40"
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[10px]">
                    {full ? t("slotsFull") : `${seva.capacityPerSlot} ${t("slotsAvailable")}`}
                  </span>
                </button>
              );
            })}
          </div>
          <BackButton onClick={() => setStep(1)} />
        </div>
      ) : null}

      {step === 3 ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitting(true);
            setTimeout(() => {
              setSubmitting(false);
              setConfirmed(true);
            }, 900);
          }}
        >
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="name">
              {t("nameLabel")}
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gold/30 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-maroon"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="phone">
              {t("phoneLabel")}
            </label>
            <input
              id="phone"
              required
              type="tel"
              pattern="[0-9+ ]{10,15}"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gold/30 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-maroon"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark"
            >
              {t("confirmCta")}
            </button>
            <BackButton onClick={() => setStep(2)} />
          </div>
        </form>
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  const t = useTranslations("booking");
  const steps = [t("step1"), t("step2"), t("step3")];
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-ink/50">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step === i + 1
                ? "bg-maroon text-cream"
                : step > i + 1
                  ? "bg-gold/40 text-maroon-dark"
                  : "bg-cream-dark text-ink/40"
            }`}
          >
            {i + 1}
          </span>
          <span className={step === i + 1 ? "text-maroon" : ""}>{label}</span>
          {i < steps.length - 1 ? <span className="mx-1 h-px w-6 bg-gold/30" /> : null}
        </div>
      ))}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 text-sm font-medium text-ink/50 hover:text-maroon"
    >
      {"←"} Back
    </button>
  );
}

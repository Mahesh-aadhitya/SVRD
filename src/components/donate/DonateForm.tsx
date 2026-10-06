"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { confirmDonation, startDonation } from "@/lib/actions/donations";
import { fieldClass } from "@/components/booking/DevoteeFields";
import { DONATION_PRESETS, DONATION_PURPOSES, MAX_DONATION, type DevoteeProfile, type DonationPurpose } from "@/lib/devotee/types";

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: () => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

// Razorpay Checkout is loaded only when the devotee presses Donate.
function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DonateForm({ profile }: { profile: DevoteeProfile }) {
  const t = useTranslations("donate");
  const tMeta = useTranslations("meta");
  const router = useRouter();
  const [purpose, setPurpose] = useState<DonationPurpose>("general");
  const [amount, setAmount] = useState<number | "">(501);
  const [name, setName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function donate(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount < 1) return setError(t("errors.invalid"));
    setBusy(true);
    setError(null);
    const [started, loaded] = await Promise.all([
      startDonation({ purpose, amount, donorName: name, phone, note }),
      loadCheckout(),
    ]);
    if (!started.ok) {
      setBusy(false);
      return setError(t(`errors.${started.error}`));
    }
    if (!loaded || !window.Razorpay) {
      setBusy(false);
      return setError(t("errors.checkout"));
    }
    const rzp = new window.Razorpay({
      key: started.keyId,
      order_id: started.orderId,
      amount: started.amountPaise,
      currency: "INR",
      name: tMeta("siteTitle"),
      description: t(`purposes.${purpose}`),
      prefill: started.prefill,
      notes: { receipt: started.receiptNo },
      theme: { color: "#7a1f1f" },
      handler: async (res: RazorpayHandlerResponse) => {
        const confirmed = await confirmDonation({
          orderId: res.razorpay_order_id,
          paymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
        });
        // If confirmation failed here, the webhook still records it — send
        // them to their donations either way.
        router.push(confirmed.ok ? `/account/donations/${confirmed.receiptNo}` : "/account?tab=donations");
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => {
      setBusy(false);
      setError(t("errors.paymentFailed"));
    });
    rzp.open();
  }

  const label = "block text-sm font-medium text-ink/70";
  return (
    <form onSubmit={donate} className="space-y-6">
      <fieldset>
        <legend className={label}>{t("purposeLabel")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {DONATION_PURPOSES.map((p) => (
            <label
              key={p}
              className={`cursor-pointer rounded-2xl border p-3 transition ${
                purpose === p ? "border-maroon bg-maroon/5 ring-1 ring-maroon" : "border-gold/30 bg-white hover:border-gold"
              }`}
            >
              <input type="radio" name="purpose" value={p} checked={purpose === p} onChange={() => setPurpose(p)} className="sr-only" />
              <span className="block font-semibold text-maroon">{t(`purposes.${p}`)}</span>
              <span className="mt-0.5 block text-xs text-ink/60">{t(`purposeNotes.${p}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <p className={label}>{t("amountLabel")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DONATION_PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                amount === v ? "border-maroon bg-maroon text-cream" : "border-gold/40 bg-white text-maroon hover:border-maroon/50"
              }`}
            >
              ₹{v.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
        <div className="relative mt-3 max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-ink/50">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_DONATION}
            required
            aria-label={t("customAmount")}
            placeholder={t("customAmount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Math.floor(Number(e.target.value)) : "")}
            className={`${fieldClass} pl-7`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="donor-name">{t("nameLabel")}</label>
          <input id="donor-name" required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className={label} htmlFor="donor-phone">{t("phoneLabel")}</label>
          <input id="donor-phone" type="tel" required pattern="[0-9+ \-]{10,16}" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="donor-note">
            {t("noteLabel")} <span className="font-normal text-ink/40">({t("optional")})</span>
          </label>
          <input id="donor-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} className={fieldClass} />
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-5">
        <p className="text-xs text-ink/55">{t("secureNote")}</p>
        <button
          disabled={busy || !amount}
          className="rounded-full bg-maroon px-8 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
        >
          {busy ? t("processing") : t("cta", { amount: amount ? amount.toLocaleString("en-IN") : "—" })}
        </button>
      </div>
    </form>
  );
}

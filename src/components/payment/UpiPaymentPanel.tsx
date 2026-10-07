"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPaymentProofUpload, startPaymentSession, submitPaymentProof, type PaymentError } from "@/lib/actions/payments";
import type { PaymentRejection } from "@/lib/payment-check";
import { uploadFile } from "@/components/admin/uploadFile";

export type UpiDetails = { upiId: string; upiNumber: string; upiPayeeName: string; upiQrUrl: string | null };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older in-app browsers: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

type Failure = { code: PaymentError } | { code: "invalid"; reason: PaymentRejection; details: Record<string, string | number> };

const clock = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};

/**
 * Pay a booking by UPI: the temple's QR, UPI ID and number (each one tap
 * to copy) and a button that opens the phone's UPI app with the amount
 * filled in — valid for 10 minutes at a time — then the payment screenshot
 * upload, which is checked and issues the ticket at once.
 *
 * On the booking screen ("booking") the upload is offered only while the
 * QR is valid; after that the devotee is sent to their ticket / My
 * bookings, where ("ticket") they can upload any time and still download
 * the ticket.
 */
export default function UpiPaymentPanel({
  mode,
  reference,
  ticketToken,
  amount,
  upi,
  fallbackPayee,
  rejectedNote,
  onSubmitted,
}: {
  mode: "booking" | "ticket";
  reference: string;
  ticketToken: string;
  amount: number;
  upi: UpiDetails;
  /** Shown as the payee when the admin hasn't entered one (the temple's name). */
  fallbackPayee: string;
  /** Why an earlier screenshot was rejected, if it was. */
  rejectedNote?: string | null;
  onSubmitted: (utr: string) => void;
}) {
  const t = useTranslations("payment");
  const tBooking = useTranslations("booking");
  const [copied, setCopied] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [stage, setStage] = useState<"idle" | "uploading" | "reading">("idle");
  const [error, setError] = useState<Failure | null>(null);
  const [session, setSession] = useState<{ expiresAt: number; skew: number } | null>(null);
  const [sessionState, setSessionState] = useState<"loading" | "none" | "ready" | "error">("loading");
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const payee = upi.upiPayeeName || fallbackPayee;
  const note = `Seva ${reference}`;

  // Free the last preview when the panel goes away.
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const open = (resumeOnly: boolean) =>
    startPaymentSession(reference, ticketToken, resumeOnly)
      .then((r) => {
        if ("error" in r) return setSessionState("error");
        if (!r.session) return setSessionState("none");
        // Count down on the server's clock, whatever the phone's says.
        setSession({ expiresAt: r.session.expiresAt, skew: r.session.serverNow - Date.now() });
        setNow(Date.now());
        setSessionState("ready");
      })
      .catch(() => setSessionState("error"));

  // The booking screen opens the QR straight away; the ticket page picks up
  // a QR window still running (after a refresh) or waits for a tap.
  useEffect(() => {
    open(mode === "ticket");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = session ? session.expiresAt - (now + session.skew) : 0;
  const active = sessionState === "ready" && remaining > 0;
  const expired = sessionState === "ready" && remaining <= 0;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  // Opens Google Pay / PhonePe / Paytm / BHIM with everything filled in.
  const upiLink = upi.upiId
    ? `upi://pay?${new URLSearchParams({ pa: upi.upiId, pn: payee, am: amount.toFixed(2), cu: "INR", tn: note }).toString()}`
    : null;

  async function copy(key: string, value: string) {
    if (await copyText(value)) {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    }
  }

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (picked.size > MAX_BYTES || !(picked.type.startsWith("image/") || /\.(heic|heif)$/i.test(picked.name))) {
      setError({ code: "bad_file" });
      return;
    }
    setError(null);
    setFile(picked);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(picked);
    setPreview(previewRef.current);
  }

  async function submit() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    try {
      const type = file.type || (/\.heif$/i.test(file.name) ? "image/heif" : "image/heic");
      const path = await uploadFile(
        "payment-proofs",
        async () => {
          const r = await requestPaymentProofUpload(reference, ticketToken, type);
          if (r.error) throw new PaymentFailure({ code: r.error });
          return r;
        },
        new File([file], file.name, { type }),
      );
      setStage("reading");
      const result = await submitPaymentProof({ reference, token: ticketToken, path, utr });
      if (!result.ok) {
        throw new PaymentFailure(
          result.error === "invalid" ? { code: "invalid", reason: result.reason, details: result.details } : { code: result.error },
        );
      }
      onSubmitted(result.utr);
    } catch (e) {
      setError(e instanceof PaymentFailure ? e.failure : { code: "failed" });
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  // On the booking screen the upload closes with the QR (unless one is
  // already on its way); from then on it's on the ticket page.
  const uploadHere = mode === "ticket" || active || busy;
  const ticketHref = { pathname: `/ticket/${reference}`, query: { t: ticketToken } };

  return (
    <div className="rounded-2xl border border-gold/40 bg-white/90 p-4 text-left shadow-sm sm:p-5">
      <p className="font-display text-xl text-maroon">{t("title", { amount })}</p>
      <p className="mt-1 text-sm text-ink/65">{t("subtitle")}</p>

      {rejectedNote ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-800">{t("rejectedNote", { note: rejectedNote })}</p>
      ) : null}

      {/* Step 1 — pay, while the QR is valid */}
      <Step number={1} title={t("step1")}>
        {sessionState === "loading" ? (
          <p className="rounded-xl bg-cream/60 px-3 py-4 text-center text-sm text-ink/55">{t("preparingQr")}</p>
        ) : sessionState === "error" ? (
          <div className="rounded-xl bg-red-500/10 px-3 py-3 text-sm text-red-800">
            {t("errors.failed")}{" "}
            <button type="button" onClick={() => open(false)} className="font-semibold underline">
              {t("tryAgain")}
            </button>
          </div>
        ) : sessionState === "none" ? (
          <button
            type="button"
            onClick={() => {
              setSessionState("loading");
              open(false);
            }}
            className="h-12 w-full rounded-full bg-maroon px-5 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark"
          >
            {t("showQr", { amount })}
          </button>
        ) : expired ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">{t("expiredTitle")}</p>
            <p className="mt-1">{mode === "booking" ? t("expiredBodyBooking") : t("expiredBodyTicket")}</p>
            <button
              type="button"
              onClick={() => {
                setSessionState("loading");
                open(false);
              }}
              className="mt-3 h-10 rounded-full bg-maroon px-5 text-xs font-semibold text-cream hover:bg-maroon-dark"
            >
              {t("restart")}
            </button>
          </div>
        ) : (
          <>
            <p
              role="timer"
              aria-live="off"
              className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                remaining < 2 * 60_000 ? "bg-red-500/10 text-red-700" : "bg-gold/20 text-maroon"
              }`}
            >
              ⏱ {t("validFor", { time: clock(remaining) })}
            </p>
            {upiLink ? (
              <a
                href={upiLink}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark sm:hidden"
              >
                <UpiIcon />
                {t("openApp", { amount })}
              </a>
            ) : null}

            <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {upi.upiQrUrl ? (
                <div className="shrink-0 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded QR, shown as-is */}
                  <img
                    src={upi.upiQrUrl}
                    alt={t("qrAlt")}
                    className="h-48 w-48 rounded-xl border border-gold/30 bg-white object-contain p-2"
                  />
                  <p className="mt-1 text-xs text-ink/55">{t("scanQr")}</p>
                </div>
              ) : null}

              <dl className="w-full min-w-0 flex-1 divide-y divide-gold/15 rounded-xl border border-gold/25 bg-cream/40">
                <Row label={t("payee")} value={payee} />
                {upi.upiId ? (
                  <Row label={t("upiId")} value={upi.upiId} mono copyLabel={copied === "id" ? t("copied") : t("copy")} onCopy={() => copy("id", upi.upiId)} />
                ) : null}
                {upi.upiNumber ? (
                  <Row
                    label={t("upiNumber")}
                    value={upi.upiNumber}
                    mono
                    copyLabel={copied === "num" ? t("copied") : t("copy")}
                    onCopy={() => copy("num", upi.upiNumber)}
                  />
                ) : null}
                <Row
                  label={t("amount")}
                  value={`₹${amount}`}
                  strong
                  copyLabel={copied === "amt" ? t("copied") : t("copy")}
                  onCopy={() => copy("amt", String(amount))}
                />
                <Row label={t("note")} value={note} mono copyLabel={copied === "note" ? t("copied") : t("copy")} onCopy={() => copy("note", note)} />
              </dl>
            </div>
            <p className="mt-2 text-xs text-ink/55">{t("windowRule")}</p>
          </>
        )}
      </Step>

      {/* Step 2 — upload the screenshot */}
      <Step number={2} title={t("step2")}>
        {!uploadHere ? (
          <div className="rounded-xl bg-cream/60 px-4 py-3 text-sm text-ink/75">
            <p>{t("uploadMoved")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={ticketHref} className="rounded-full bg-maroon px-5 py-2.5 text-xs font-semibold text-cream hover:bg-maroon-dark">
                {t("uploadOnTicket")}
              </Link>
              <Link href="/account" className="rounded-full border border-maroon/30 px-5 py-2.5 text-xs font-semibold text-maroon hover:bg-white">
                {tBooking("myBookings")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <input ref={inputRef} type="file" accept={ACCEPT} onChange={choose} className="hidden" />
            {file && preview ? (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={preview} alt="" className="h-28 w-20 shrink-0 rounded-lg border border-gold/30 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="mt-1 text-xs font-semibold text-maroon hover:underline disabled:opacity-50"
                  >
                    {t("changeFile")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gold/50 bg-cream/40 px-4 py-6 text-center hover:border-maroon/50"
              >
                <UploadIcon />
                <span className="text-sm font-semibold text-maroon">{t("uploadCta")}</span>
                <span className="text-xs text-ink/50">{t("uploadHint")}</span>
              </button>
            )}

            <label htmlFor={`utr-${reference}`} className="mt-4 block text-sm font-medium text-ink/70">
              {t("utrLabel")} <span className="font-normal text-ink/40">({t("optional")})</span>
            </label>
            <input
              id={`utr-${reference}`}
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              inputMode="text"
              autoComplete="off"
              maxLength={40}
              placeholder="e.g. 412345678901"
              className="mt-1 block h-11 w-full rounded-xl border border-gold/30 bg-white px-3 font-mono text-sm text-ink outline-none focus:border-maroon"
            />
            <p className="mt-1 text-xs text-ink/50">{t("utrHint")}</p>

            {error ? (
              <div role="alert" className="mt-3 rounded-xl border border-red-600/30 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {error.code === "invalid" ? (
                  <>
                    <p className="font-bold">{t("invalidTitle")}</p>
                    <p className="mt-0.5">{t(`invalid.${error.reason}`, { ...error.details, expected: error.details.expected ?? amount })}</p>
                  </>
                ) : (
                  t(`errors.${error.code}`)
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={!file || busy}
              className="mt-4 h-12 w-full rounded-full bg-maroon px-6 text-sm font-semibold text-cream shadow-sm hover:bg-maroon-dark disabled:opacity-50"
            >
              {stage === "uploading" ? t("uploading") : stage === "reading" ? t("reading") : t("submit")}
            </button>
          </>
        )}
      </Step>
    </div>
  );
}

class PaymentFailure extends Error {
  constructor(readonly failure: Failure) {
    super(failure.code);
  }
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/25 text-xs font-bold text-maroon">{number}</span>
        {title}
      </p>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  strong,
  copyLabel,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  copyLabel?: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] uppercase tracking-wide text-ink/50">{label}</dt>
        <dd className={`break-all text-sm text-ink ${mono ? "font-mono" : ""} ${strong ? "text-base font-bold" : "font-medium"}`}>{value}</dd>
      </div>
      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="h-9 shrink-0 rounded-full border border-maroon/30 bg-white px-3 text-xs font-semibold text-maroon hover:bg-maroon hover:text-cream"
        >
          {copyLabel}
        </button>
      ) : null}
    </div>
  );
}

function UpiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-maroon/70" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" strokeLinecap="round" />
    </svg>
  );
}

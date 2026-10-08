"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

type Kind = "image" | "pdf";

/** Button and status wording — passed in so it can stay in the page's
 *  language while the card itself is in another (see PanchangShare). */
export type ShareLabels = Record<"shareImage" | "sharePdf" | "whatsapp" | "preparing" | "shareFailed" | "saved", string>;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Share `card` (the ShareCard) as a PNG or PDF through the device's share
 * sheet (WhatsApp, Telegram, Signal…), falling back to a download where
 * file sharing isn't supported. Plus a plain-text WhatsApp message.
 *
 * The card is only mounted while a file is being made — off-screen, behind
 * the page — so it can never show up on the page itself.
 */
export default function ShareActions({
  card,
  fileBase,
  shareTitle,
  whatsappText,
  labels,
}: {
  card: ReactNode;
  fileBase: string;
  shareTitle: string;
  whatsappText: string;
  labels?: ShareLabels;
}) {
  const translate = useTranslations("panchangam");
  const t = (key: keyof ShareLabels) => labels?.[key] ?? translate(key);
  const [busy, setBusy] = useState<Kind | null>(null);
  const [status, setStatus] = useState<"failed" | "saved" | null>(null);
  // Building the file can outlast the tap's "user activation" window, after
  // which browsers (Safari especially) refuse navigator.share. When that
  // happens we keep the file and offer a second tap that shares instantly.
  const [pending, setPending] = useState<File | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  // PNG keeps the image crisp; the PDF embeds a JPEG so it stays small
  // enough for chat apps (a PNG inside a PDF is ~10 MB).
  async function render(kind: Kind) {
    await nextFrame();
    await document.fonts?.ready;
    const node = hostRef.current?.firstElementChild as HTMLElement | null;
    if (!node) throw new Error("no card");
    // The emblem and watermark images must be decoded before capture.
    await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
    const { toPng, toJpeg } = await import("html-to-image");
    const options = { pixelRatio: 1.5, cacheBust: true, backgroundColor: "#05030f", quality: 0.9 };
    const capture = kind === "image" ? toPng : toJpeg;
    // Safari sometimes paints fonts/images only on the second pass.
    await capture(node, options);
    const dataUrl = await capture(node, options);
    return { dataUrl, width: node.offsetWidth, height: node.offsetHeight };
  }

  async function buildFile(kind: Kind) {
    const { dataUrl, width, height } = await render(kind);
    if (kind === "image") {
      const blob = await (await fetch(dataUrl)).blob();
      return new File([blob], `${fileBase}.png`, { type: "image/png" });
    }
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [width, height], hotfixes: ["px_scaling"] });
    pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
    return new File([pdf.output("blob")], `${fileBase}.pdf`, { type: "application/pdf" });
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setStatus("saved");
  }

  async function deliver(file: File) {
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: shareTitle, text: shareTitle });
        setPending(null);
      } catch (err) {
        const name = (err as DOMException).name;
        if (name === "NotAllowedError") setPending(file);
        else if (name !== "AbortError") download(file);
      }
      return;
    }
    download(file);
  }

  async function share(kind: Kind) {
    setBusy(kind);
    setStatus(null);
    setPending(null);
    try {
      await deliver(await buildFile(kind));
    } catch {
      setStatus("failed");
    } finally {
      setBusy(null);
    }
  }

  const button =
    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => share("image")}
          disabled={busy !== null}
          className={`${button} bg-gradient-to-r from-amber-300 to-orange-400 text-[#1a0f05] shadow-[0_0_24px_rgba(255,180,80,0.35)] hover:brightness-110`}
        >
          <ImageIcon />
          {busy === "image" ? t("preparing") : t("shareImage")}
        </button>
        <button
          type="button"
          onClick={() => share("pdf")}
          disabled={busy !== null}
          className={`${button} border border-amber-200/40 bg-white/5 text-amber-100 hover:bg-white/10`}
        >
          <DocIcon />
          {busy === "pdf" ? t("preparing") : t("sharePdf")}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${button} border border-emerald-300/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20`}
        >
          <ChatIcon />
          {t("whatsapp")}
        </a>
      </div>
      {pending ? (
        <button
          type="button"
          onClick={() => deliver(pending)}
          className={`${button} animate-pulse bg-amber-300 text-[#1a0f05]`}
        >
          {pending.name.endsWith(".pdf") ? t("sharePdf") : t("shareImage")} →
        </button>
      ) : null}
      {status === "failed" ? <p className="text-sm text-rose-300">{t("shareFailed")}</p> : null}
      {status === "saved" ? <p className="text-sm text-emerald-200">{t("saved")}</p> : null}
      {busy
        ? createPortal(
            <div
              ref={hostRef}
              aria-hidden
              style={{ position: "fixed", top: 0, left: 0, zIndex: -1, transform: "translateX(-110%)", pointerEvents: "none" }}
            >
              {card}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 14h8M8 17h5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
    </svg>
  );
}

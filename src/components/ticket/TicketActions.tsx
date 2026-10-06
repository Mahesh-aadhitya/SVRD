"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Download-as-PNG and print for the #temple-ticket element (seva tickets
// and donation receipts).
export default function TicketActions({
  reference,
  fileName,
  showKeepLink = true,
}: {
  reference: string;
  fileName?: string;
  showKeepLink?: boolean;
}) {
  const t = useTranslations("ticket");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    const node = document.getElementById("temple-ticket");
    if (!node) return;
    setBusy(true);
    setFailed(false);
    try {
      const { toPng } = await import("html-to-image");
      const options = { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" };
      // Safari sometimes paints images only on the second pass.
      await toPng(node, options);
      const dataUrl = await toPng(node, options);
      const link = document.createElement("a");
      link.download = `${fileName ?? `seva-ticket-${reference}`}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3 print:hidden">
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
        >
          {busy ? t("preparing") : t("download")}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-maroon/40 px-6 py-3 text-sm font-semibold text-maroon hover:bg-maroon/5"
        >
          {t("print")}
        </button>
      </div>
      {failed ? <p className="text-sm text-red-700">{t("downloadFailed")}</p> : null}
      {showKeepLink ? <p className="text-xs text-ink/50">{t("keepLink")}</p> : null}
    </div>
  );
}

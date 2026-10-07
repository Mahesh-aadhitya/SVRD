"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { PanchangLocation } from "@/lib/panchang/compute";
import type { Kundali } from "@/lib/panchang/kundali";
import type { ChartStyle } from "./JatakaChart";
import KundaliSheet, { MM_PX, PAPER, paperMm, type Orientation, type PaperSize } from "./KundaliSheet";

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const PREVIEW_WIDTH = 300;

// Print the kundali, or save it as a PDF, on any paper size — with a live
// preview of how the sheet lays out on that page.
export default function KundaliExport({
  kundali,
  input,
  locale,
  chartStyle,
}: {
  kundali: Kundali;
  input: { date: string; time: string; location: PanchangLocation; name: string };
  locale: string;
  chartStyle: ChartStyle;
}) {
  const t = useTranslations("panchangam");
  const siteTitle = useTranslations("meta")("siteTitle");
  const [size, setSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [busy, setBusy] = useState<"pdf" | "print" | null>(null);
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const { w, h } = paperMm(size, orientation);
  const previewScale = PREVIEW_WIDTH / (w * MM_PX);
  const sheet = <KundaliSheet kundali={kundali} input={input} locale={locale} size={size} orientation={orientation} siteTitle={siteTitle} chartStyle={chartStyle} />;
  const fileBase = `kundali-${(input.name || input.date).replace(/[^\p{L}\p{N}]+/gu, "-")}`;

  async function ready() {
    await nextFrame();
    await document.fonts?.ready;
    const node = hostRef.current?.firstElementChild as HTMLElement | null;
    if (!node) throw new Error("no sheet");
    await Promise.all([...node.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
    await nextFrame();
    return node;
  }

  async function pdf() {
    setBusy("pdf");
    setFailed(false);
    try {
      const node = await ready();
      const { toJpeg } = await import("html-to-image");
      const options = { pixelRatio: 2, quality: 0.92, backgroundColor: "#fffaf0", cacheBust: true };
      await toJpeg(node, options); // Safari paints fonts/images on the second pass
      const image = await toJpeg(node, options);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: [w, h], orientation: orientation === "portrait" ? "p" : "l" });
      doc.addImage(image, "JPEG", 0, 0, w, h);
      doc.save(`${fileBase}-${size}.pdf`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  async function print() {
    setBusy("print");
    setFailed(false);
    try {
      await ready();
      // Safari returns from print() at once; keep the sheet until it's done.
      await new Promise<void>((resolve) => {
        window.addEventListener("afterprint", () => resolve(), { once: true });
        window.print();
        setTimeout(resolve, 120_000);
      });
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  // While printing, the page shows only the sheet, at the chosen paper size.
  useEffect(() => {
    if (busy !== "print") return;
    const style = document.createElement("style");
    style.textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }
@media print {
  body > *:not(#kundali-print) { display: none !important; }
  #kundali-print { position: static !important; transform: none !important; }
  html, body { background: #fffaf0 !important; }
}`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [busy, w, h]);

  const select = "mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b0820]/70 p-5 backdrop-blur-md">
      <h3 className="font-display text-lg text-amber-200">{t("kundali.printTitle")}</h3>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row">
        <div className="space-y-3 sm:w-56">
          <label className="block text-xs text-indigo-100/70">
            {t("kundali.paper")}
            <select value={size} onChange={(e) => setSize(e.target.value as PaperSize)} className={select}>
              {(Object.keys(PAPER) as PaperSize[]).map((p) => (
                <option key={p} value={p} className="bg-[#0b0820]">
                  {p} · {PAPER[p].w} × {PAPER[p].h} mm
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-indigo-100/70">
            {t("kundali.orientation")}
            <select value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} className={select}>
              <option value="portrait" className="bg-[#0b0820]">
                {t("kundali.portrait")}
              </option>
              <option value="landscape" className="bg-[#0b0820]">
                {t("kundali.landscape")}
              </option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={pdf}
              disabled={busy !== null}
              className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-2 text-sm font-semibold text-[#1a0f05] disabled:opacity-60"
            >
              {busy === "pdf" ? t("preparing") : t("kundali.downloadPdf")}
            </button>
            <button
              type="button"
              onClick={print}
              disabled={busy !== null}
              className="rounded-full border border-amber-200/40 bg-white/5 px-5 py-2 text-sm font-semibold text-amber-100 disabled:opacity-60"
            >
              {busy === "print" ? t("preparing") : t("kundali.print")}
            </button>
          </div>
          {failed ? <p className="text-xs text-rose-300">{t("shareFailed")}</p> : null}
        </div>

        {/* Live preview of the sheet on this paper. */}
        <div
          className="mx-auto shrink-0 overflow-hidden rounded-md shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
          style={{ width: PREVIEW_WIDTH, height: h * MM_PX * previewScale }}
          aria-hidden
        >
          <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: w * MM_PX }}>{sheet}</div>
        </div>
      </div>

      {/* The full-size sheet that's printed or captured, kept off-screen. */}
      {busy
        ? createPortal(
            <div
              id="kundali-print"
              ref={hostRef}
              aria-hidden
              style={{ position: "fixed", top: 0, left: 0, zIndex: -1, transform: "translateX(-110%)", pointerEvents: "none" }}
            >
              {sheet}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}

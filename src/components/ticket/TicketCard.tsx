import type { CSSProperties, ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Ticket } from "@/lib/data/bookings";
import type { TempleInfo } from "@/lib/content-types";
import { formatSlot } from "@/lib/seva-types";
import { formatIso } from "@/lib/dates";
import { nakshatraLabel } from "@/lib/nakshatras";

// Plain <img> (not next/image) so the ticket can be captured as a PNG;
// routed through the image optimizer to keep the download small.
const optimized = (src: string, width: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

const MAROON = "#7a1f1f";
const GOLD = "#b98a3d";
const INK = "#2a1b12";
const MUTED = "rgba(42,27,18,0.6)";
const LINE = "1px solid rgba(122,31,31,0.25)";

type Lang = "en" | "kn";
type Badge = { label: ReactNode; bg: string; fg: string };

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `${"X".repeat(digits.length - 4)}${digits.slice(-4)}` : phone;
}

const cell: CSSProperties = { border: LINE, padding: "7px 10px", verticalAlign: "top" };
const labelCell: CSSProperties = { ...cell, backgroundColor: "rgba(185,138,61,0.10)", color: MUTED, fontWeight: 600, width: "22%" };

// Kannada needs its own face (the Latin fonts have no Kannada glyphs, so
// the browser would otherwise pick a mismatched system font) and a taller
// line for its vowel signs.
const KN_TEXT: CSSProperties = { fontFamily: "var(--font-temple-kannada), sans-serif", lineHeight: 1.55 };
const KN_DISPLAY: CSSProperties = {
  fontFamily: "var(--font-temple-kannada), sans-serif",
  lineHeight: 1.35,
};

function Text({ lang, children, style }: { lang: Lang; children: ReactNode; style?: CSSProperties }) {
  return (
    <span lang={lang} style={lang === "kn" ? { ...KN_TEXT, ...style } : style}>
      {children}
    </span>
  );
}

// Bilingual text: the page's language first, the other one beneath it in a
// smaller, muted line — or side by side with a slash for short headings.
function Bi({
  primary,
  secondary,
  langs,
  inline = false,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  langs: [Lang, Lang];
  inline?: boolean;
}) {
  if (primary === secondary) return <Text lang={langs[0]}>{primary}</Text>;
  return inline ? (
    <>
      <Text lang={langs[0]}>{primary}</Text>
      <span style={{ opacity: 0.55, margin: "0 6px" }}>/</span>
      <Text lang={langs[1]} style={{ fontWeight: 500 }}>
        {secondary}
      </Text>
    </>
  ) : (
    <>
      <Text lang={langs[0]} style={{ display: "block" }}>
        {primary}
      </Text>
      <Text lang={langs[1]} style={{ display: "block", fontSize: "0.93em", fontWeight: 500, color: MUTED, marginTop: 1 }}>
        {secondary}
      </Text>
    </>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 mt-5 text-[13px] font-bold" style={{ color: MAROON }}>
      {children}
    </p>
  );
}

// TTD-style e-ticket in English and Kannada: brand header with the temple
// details the admin keeps under Temple Info, reference strip, bordered
// detail tables, devotee list and instructions, with the chakram watermark
// in the centre. Sized for A4 when printed.
export default async function TicketCard({
  ticket,
  temple,
  locale,
  qrSvg,
}: {
  /** Server-generated SVG markup (trusted — from the qrcode library). */
  qrSvg: string;
  ticket: Ticket;
  temple: TempleInfo | null;
  locale: Lang;
}) {
  const other: Lang = locale === "kn" ? "en" : "kn";
  const [tp, ts, metaP] = await Promise.all([
    getTranslations({ locale, namespace: "ticket" }),
    getTranslations({ locale: other, namespace: "ticket" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);
  type Values = Record<string, string | number>;
  type Key = Parameters<typeof tp>[0];
  // The ticket is in the page's language; only the instructions also carry
  // the other language (stacked beneath), so every devotee can read them.
  const L = (key: Key, values?: Values) => <Text lang={locale}>{tp(key, values)}</Text>;
  const both = (fn: (lang: Lang) => string) => <Text lang={locale}>{fn(locale)}</Text>;
  const LBi = (key: Key, values?: Values, inline = false) => (
    <Bi primary={tp(key, values)} secondary={ts(key, values)} langs={[locale, other]} inline={inline} />
  );

  // After darshan the same QR is still needed for prasadam; it's spent
  // only once both are done.
  const darshanDone = !!ticket.checkedInAt;
  const used = darshanDone && !!ticket.prasadamClaimedAt;
  const bookingBadge: Badge = used
    ? { label: L("status.used"), bg: "#e5e7eb", fg: "#1f2937" }
    : darshanDone
      ? { label: L("status.darshanDone"), bg: "#e0f2fe", fg: "#075985" }
      : ticket.status === "cancelled"
        ? { label: L("status.cancelled"), bg: "#fee2e2", fg: "#991b1b" }
        : ticket.status === "confirmed"
          ? { label: L("status.confirmed"), bg: "#dcfce7", fg: "#14532d" }
          : { label: L("status.pending"), bg: "#fef3c7", fg: "#78350f" };

  const amount = { amount: ticket.amount };
  const paymentBadge: Badge =
    ticket.amount === 0
      ? { label: L("payment.free"), bg: "#dcfce7", fg: "#14532d" }
      : ticket.paymentStatus === "paid"
        ? { label: L("payment.paid", amount), bg: "#dcfce7", fg: "#14532d" }
        : ticket.paymentStatus === "submitted"
          ? { label: L("payment.submitted", amount), bg: "#e0f2fe", fg: "#075985" }
        : ticket.paymentStatus === "refunded"
          ? { label: L("payment.refunded"), bg: "#e0e7ff", fg: "#3730a3" }
          : { label: L("payment.unpaid", amount), bg: "#fef3c7", fg: "#78350f" };

  const badge = (b: Badge) => (
    <span style={{ backgroundColor: b.bg, color: b.fg }} className="inline-block rounded-md px-2 py-1 text-xs font-bold leading-tight">
      {b.label}
    </span>
  );

  const formatStamp = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

  // Two key/value pairs per row, like the TTD ticket layout.
  const details: [ReactNode, ReactNode][] = [
    [L("seva"), <strong key="s">{both((l) => ticket.sevaName[l])}</strong>],
    [L("tickets"), <strong key="q">{ticket.quantity}</strong>],
    [
      L("date"),
      <strong key="d">
        {both((l) => formatIso(ticket.date, l, { weekday: "short", day: "numeric", month: "short", year: "numeric" }))}
      </strong>,
    ],
    [L("time"), <strong key="ti">{ticket.slot ? formatSlot(ticket.slot, "en") : L("wholeDay")}</strong>],
    [L("amount"), <strong key="a">{ticket.amount === 0 ? L("payment.free") : `₹${ticket.amount}`}</strong>],
    [L("paymentLabel"), badge(paymentBadge)],
    [L("statusLabel"), badge(bookingBadge)],
    ...(ticket.paymentMethod === "upi" && ticket.paymentStatus !== "unpaid"
      ? ([
          [L("paymentMode"), "UPI"],
          [L("utr"), <span key="utr" style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{ticket.paymentUtr ?? "—"}</span>],
          ...(ticket.paymentSubmittedAt ? [[L("paymentSubmittedOn"), formatStamp(ticket.paymentSubmittedAt)]] : []),
        ] as [ReactNode, ReactNode][])
      : ticket.paymentMethod === "counter" && ticket.paymentStatus === "paid"
        ? ([[L("paymentMode"), L("counter")]] as [ReactNode, ReactNode][])
        : []),
    [L("phone"), maskPhone(ticket.phone)],
    [L("bookedOn"), formatStamp(ticket.createdAt)],
    [L("contactName"), ticket.devoteeName],
    ...(darshanDone
      ? ([
          [L("darshanDoneOn"), formatStamp(ticket.checkedInAt!)],
          [L("prasadamLabel"), ticket.prasadamClaimedAt ? formatStamp(ticket.prasadamClaimedAt) : L("prasadamPending")],
        ] as [ReactNode, ReactNode][])
      : []),
  ];
  const detailRows = Array.from({ length: Math.ceil(details.length / 2) }, (_, i) => details.slice(i * 2, i * 2 + 2));

  const instructionKeys: [Key, Values?][] = used
    ? []
    : darshanDone
      ? [["instructions.prasadam"]]
      : [
          ...(ticket.amount > 0 && ticket.paymentStatus === "unpaid"
            ? ([["instructions.pay", amount]] as [Key, Values][])
            : ticket.paymentStatus === "submitted"
              ? ([["instructions.upiPending"]] as [Key, Values?][])
              : []),
          ["instructions.arrive"],
          ["instructions.id"],
          ["instructions.transfer"],
          ["instructions.dress"],
        ];

  const address = temple ? [temple.addressLine1, temple.addressLine2].filter(Boolean) : [];
  const contact = temple ? [temple.phone && `☎ ${temple.phone}`, temple.email && `✉ ${temple.email}`].filter(Boolean) : [];

  return (
    <div
      id="temple-ticket"
      className="relative mx-auto w-full max-w-[794px] overflow-hidden"
      style={{ backgroundColor: "#ffffff", border: `1.5px solid ${MAROON}`, color: INK }}
    >
      {/* Chakram watermark — centred behind the whole ticket */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={optimized("/images/chakra-watermark.png", 640)} alt="" style={{ width: "62%", maxWidth: 440, opacity: 0.06 }} />
      </div>

      {/* Header: QR · temple · Swamy */}
      <div className="relative flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6" style={{ borderBottom: `3px double ${GOLD}` }}>
        {/* QR opens this live ticket — counter staff scan it to verify */}
        <div className="shrink-0 text-center" style={{ width: 92 }}>
          <div className="relative" style={{ width: 92, height: 92 }}>
            <div
              className="[&>svg]:block [&>svg]:h-full [&>svg]:w-full"
              style={{
                width: 92,
                height: 92,
                padding: 4,
                border: `1px solid ${GOLD}`,
                backgroundColor: "#fff",
                opacity: used ? 0.15 : 1,
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            {/* Once darshan and prasadam are done, the QR is spent — stamp it so it isn't presented again. */}
            {used ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="-rotate-12 rounded px-1 py-0.5 text-center text-[10px] font-extrabold uppercase leading-tight"
                  style={{ color: "#991b1b", border: "2px solid #991b1b", backgroundColor: "rgba(255,255,255,0.85)" }}
                >
                  {L("usedStamp")}
                </span>
              </div>
            ) : null}
          </div>
          <p className="mt-0.5 text-[9px] font-semibold leading-tight" style={{ color: used ? "#991b1b" : MUTED }}>
            {used ? L("qrUsed") : darshanDone ? L("scanForPrasadam") : L("scanToVerify")}
          </p>
        </div>
        <div className="min-w-0 flex-1 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimized("/images/emblem-full.png", 384)}
            alt=""
            className="mx-auto mb-1"
            style={{ height: 44, width: "auto", maxWidth: "100%" }}
          />
          <p
            lang={locale}
            className="text-lg sm:text-2xl"
            style={{
              color: MAROON,
              ...(locale === "kn" ? KN_DISPLAY : { fontFamily: "var(--font-temple-display), serif", lineHeight: 1.2 }),
            }}
          >
            {metaP("siteTitle")}
          </p>
          {address.length ? (
            <p className="mt-1 text-[11px] leading-snug sm:text-xs" style={{ color: MUTED }}>
              {address.join(", ")}
            </p>
          ) : null}
          {contact.length ? (
            <p className="text-[11px] leading-snug sm:text-xs" style={{ color: MUTED }}>
              {contact.join("  ·  ")}
            </p>
          ) : null}
        </div>
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: 92, height: 116, borderRadius: "46px 46px 8px 8px", border: `2px solid ${GOLD}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimized("/images/deity-hero.png", 384)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%" }}
          />
        </div>
      </div>

      {/* Title strip with the reference */}
      <div
        className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6"
        style={{ backgroundColor: MAROON, color: "#fbf1de" }}
      >
        <p className="text-sm font-bold">{L("heading")}</p>
        <p className="text-sm">
          {L("reference")}:{" "}
          <span className="font-mono text-base font-bold tracking-widest">{ticket.reference}</span>
        </p>
      </div>

      <div className="relative px-4 pb-5 sm:px-6">
        <SectionTitle>{L("bookingDetails")}</SectionTitle>
        {/* Wide screens: 4 columns (2 pairs per row); phones: 2 columns. */}
        <table className="hidden w-full border-collapse text-[13px] sm:table">
          <tbody>
            {detailRows.map((row, i) => (
              <tr key={i}>
                {row.map(([label, value], j) => (
                  <FragmentCells key={j} label={label} value={value} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse text-[13px] sm:hidden">
          <tbody>
            {details.map(([label, value], i) => (
              <tr key={i}>
                <td style={{ ...labelCell, width: "38%" }}>{label}</td>
                <td style={cell}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>{L("devotees")}</SectionTitle>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th style={{ ...labelCell, width: 36, textAlign: "left" }}>#</th>
              {(["name", "gotram", "nakshatram"] as const).map((h) => (
                <th key={h} style={{ ...labelCell, width: undefined, textAlign: "left" }}>
                  {L(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ticket.devotees.map((d, i) => (
              <tr key={i}>
                <td style={cell}>{i + 1}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{d.name}</td>
                <td style={cell}>{d.gotram || "—"}</td>
                <td style={cell}>{d.nakshatram ? both((l) => nakshatraLabel(d.nakshatram!, l)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {instructionKeys.length ? <SectionTitle>{LBi("instructionsTitle", undefined, true)}</SectionTitle> : null}
        <ol className="list-decimal space-y-2 pl-5 text-[12px] leading-relaxed" style={{ color: INK }}>
          {instructionKeys.map(([key, values]) => (
            <li key={key}>{LBi(key, values)}</li>
          ))}
        </ol>
      </div>

      <div className="relative px-4 py-2.5 text-center text-xs sm:px-6" style={{ borderTop: `3px double ${GOLD}`, color: MAROON }}>
        {L(used ? "footerUsed" : darshanDone ? "footerDarshanDone" : ticket.status === "cancelled" ? "footerCancelled" : "blessing")}
      </div>
    </div>
  );
}

function FragmentCells({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <>
      <td style={labelCell}>{label}</td>
      <td style={cell}>{value}</td>
    </>
  );
}

import { getBookingsForAdmin, getDarshanLogForAdmin } from "@/lib/data/bookings";
import { getAllSevasForAdmin } from "@/lib/data/sevas";
import type { BookingStatus } from "@/lib/content-types";
import { formatSlot } from "@/lib/seva-types";
import { todayInIndia } from "@/lib/dates";
import { nakshatraLabel } from "@/lib/nakshatras";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];

function csvCell(value: string | number | null) {
  let s = String(value ?? "");
  // Devotee-entered text must not be interpreted as a spreadsheet formula.
  if (/^[=@\t\r]/.test(s) || /^[+-][^0-9]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Excel needs the BOM to read UTF-8 (Kannada names) correctly.
function csvResponse(rows: (string | number | null)[][], filename: string) {
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// One row per devotee for a day (default today), grouped by seva and time
// — the list the priests use for sankalpam. Cancelled bookings are left out.
async function devoteeList(date: string, sevaId: string | undefined) {
  let bookings, sevas;
  try {
    [bookings, sevas] = await Promise.all([getBookingsForAdmin({ date, sevaId }), getAllSevasForAdmin()]);
  } catch {
    return new Response("Not authorized", { status: 401 });
  }
  const sevaOrder = new Map(sevas.map((s, i) => [s.id, i]));
  const sevaName = (id: string) => sevas.find((s) => s.id === id)?.name.en ?? id;
  const active = bookings
    .filter((b) => b.status !== "cancelled")
    .sort(
      (a, b) =>
        (sevaOrder.get(a.sevaId) ?? 0) - (sevaOrder.get(b.sevaId) ?? 0) ||
        (a.slot?.startTime ?? "").localeCompare(b.slot?.startTime ?? "") ||
        a.createdAt.localeCompare(b.createdAt),
    );

  const rows: (string | number | null)[][] = [
    ["S.No", "Seva", "Time", "Devotee name", "Gotram", "Nakshatram", "Booking reference", "Contact phone", "Booking status", "Payment", "Amount (booking)"],
  ];
  let n = 0;
  for (const b of active) {
    b.devotees.forEach((d, i) => {
      rows.push([
        ++n,
        sevaName(b.sevaId),
        b.slot ? formatSlot(b.slot, "en") : "Whole day",
        d.name,
        d.gotram,
        d.nakshatram ? nakshatraLabel(d.nakshatram, "en") : null,
        b.reference,
        b.phone,
        b.status,
        b.amount === 0 ? "free" : b.paymentStatus,
        i === 0 ? b.amount : null,
      ]);
    });
  }
  return csvResponse(rows, `devotees-${date}.csv`);
}

// One row per devotee who took darshan on `date` (by scan time), in scan order.
async function darshanList(date: string) {
  let log, sevas;
  try {
    [log, sevas] = await Promise.all([getDarshanLogForAdmin(date), getAllSevasForAdmin()]);
  } catch {
    return new Response("Not authorized", { status: 401 });
  }
  const sevaName = (id: string) => sevas.find((s) => s.id === id)?.name.en ?? id;
  const ist = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : null;
  const rows: (string | number | null)[][] = [
    ["S.No", "Darshan at", "Devotee name", "Gotram", "Nakshatram", "Seva", "Booked for", "Time", "Booking reference", "Contact phone", "Payment", "Prasadam given at"],
  ];
  let n = 0;
  for (const b of log.bookings) {
    for (const d of b.devotees) {
      rows.push([
        ++n,
        ist(b.checkedInAt),
        d.name,
        d.gotram,
        d.nakshatram ? nakshatraLabel(d.nakshatram, "en") : null,
        sevaName(b.sevaId),
        b.date,
        b.slot ? formatSlot(b.slot, "en") : "Whole day",
        b.reference,
        b.phone,
        b.amount === 0 ? "free" : b.paymentStatus,
        ist(b.prasadamClaimedAt) ?? "pending",
      ]);
    }
  }
  return csvResponse(rows, `darshan-${date}.csv`);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (params.get("view") === "darshan") {
    const date = params.get("date")?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.get("date")! : todayInIndia();
    return darshanList(date);
  }
  if (params.get("view") === "devotees") {
    const date = params.get("date")?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.get("date")! : todayInIndia();
    return devoteeList(date, params.get("seva") || undefined);
  }
  let bookings, sevas;
  try {
    [bookings, sevas] = await Promise.all([
      getBookingsForAdmin({
        status: STATUSES.find((st) => st === params.get("status")),
        sevaId: params.get("seva") || undefined,
        date: params.get("date") || undefined,
        q: params.get("q") || undefined,
      }),
      getAllSevasForAdmin(),
    ]);
  } catch {
    return new Response("Not authorized", { status: 401 });
  }

  const sevaName = (id: string) => sevas.find((s) => s.id === id)?.name.en ?? id;
  const rows = [
    ["Reference", "Devotee", "Phone", "Seva", "Date", "Time", "Tickets", "Devotees (name / gotram / nakshatram)", "Amount", "Status", "Payment", "Booked at"],
    ...bookings.map((b) => [
      b.reference,
      b.devoteeName,
      b.phone,
      sevaName(b.sevaId),
      b.date,
      b.slot ? formatSlot(b.slot, "en") : "Whole day",
      b.quantity,
      b.devotees.map((d) => [d.name, d.gotram, d.nakshatram].filter(Boolean).join(" / ")).join("; "),
      b.amount,
      b.status,
      b.paymentStatus,
      b.createdAt,
    ]),
  ];
  return csvResponse(rows, `bookings-${todayInIndia()}.csv`);
}

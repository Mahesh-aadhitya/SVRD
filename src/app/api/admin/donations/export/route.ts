import { getDonationsForAdmin } from "@/lib/data/donations";
import { DONATION_PURPOSES, type DonationPurpose } from "@/lib/devotee/types";

function csvCell(value: string | number | null) {
  let s = String(value ?? "");
  // Donor-entered text must not be interpreted as a spreadsheet formula.
  if (/^[=@\t\r]/.test(s) || /^[+-][^0-9]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = (key: string) => (/^\d{4}-\d{2}-\d{2}$/.test(params.get(key) ?? "") ? params.get(key)! : undefined);
  const purpose = params.get("purpose") as DonationPurpose | null;
  let result;
  try {
    result = await getDonationsForAdmin({
      purpose: purpose && DONATION_PURPOSES.includes(purpose) ? purpose : undefined,
      from: date("from"),
      to: date("to"),
      q: params.get("q")?.slice(0, 60) || undefined,
    });
  } catch {
    return new Response("Not authorized", { status: 401 });
  }
  const rows: (string | number | null)[][] = [
    ["Receipt", "Paid at", "Donor", "Phone", "Email", "Purpose", "Amount", "Razorpay payment", "Note"],
    ...result.donations.map((d) => [
      d.receiptNo,
      d.paidAt ? new Date(d.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null,
      d.donorName,
      d.phone,
      d.email,
      d.purpose,
      d.amount,
      d.paymentId,
      d.note,
    ]),
  ];
  // Excel needs the BOM to read UTF-8 (Kannada names) correctly.
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="donations.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

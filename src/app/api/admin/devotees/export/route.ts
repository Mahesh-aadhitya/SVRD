import { getDevoteesForAdmin } from "@/lib/data/devotees";

function csvCell(value: string | number | null) {
  let s = String(value ?? "");
  // Devotee-entered text must not be interpreted as a spreadsheet formula.
  if (/^[=@\t\r]/.test(s) || /^[+-][^0-9]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null);

export async function GET(request: Request) {
  let devotees;
  try {
    devotees = await getDevoteesForAdmin(new URL(request.url).searchParams.get("q")?.slice(0, 60) || undefined);
  } catch {
    return new Response("Not authorized", { status: 401 });
  }
  const rows: (string | number | null)[][] = [
    ["Name", "Mobile", "Email", "Signed up with", "Email verified", "Joined", "Last sign-in", "Seva bookings"],
    ...devotees.map((d) => [
      d.name,
      d.phone,
      d.email,
      d.method === "google" ? "Google" : "Email",
      d.verified ? "Yes" : "No",
      when(d.createdAt),
      when(d.lastSignInAt),
      d.bookings,
    ]),
  ];
  // Excel needs the BOM to read UTF-8 (Kannada names) correctly.
  const body = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="devotees-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

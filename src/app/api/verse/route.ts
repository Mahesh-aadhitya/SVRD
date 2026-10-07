import { getVerseForDay } from "@/lib/data/verses";
import { isValidIsoDate } from "@/lib/panchang/compute";
import { OCCASION, type OccasionKey } from "@/lib/panchang/verses";

// The panchangam's verse of the day, fetched when a visitor moves to
// another date. ?occasion= is the festival the page worked out for that day.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? "";
  if (!isValidIsoDate(date)) return Response.json({ error: "bad date" }, { status: 400 });
  const occasion = params.get("occasion");
  const key = occasion && occasion in OCCASION ? (occasion as OccasionKey) : null;
  const verse = await getVerseForDay(date, key);
  return Response.json(verse, { headers: { "Cache-Control": "no-store" } });
}

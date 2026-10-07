import "server-only";
import { importantDaysBetween } from "@/lib/panchang/important-days";
import { templeLocationFrom } from "@/lib/panchang/compute";
import { shiftIsoDate } from "@/lib/panchang/format";
import { getTempleInfo } from "@/lib/data/temple-info";
import { todayInIndia } from "@/lib/dates";

// Festivals and holy days at the temple for the next ~13 months, for the
// admin's booking calendar.
export async function getUpcomingImportantDays() {
  const info = await getTempleInfo().catch(() => null);
  const today = todayInIndia();
  return importantDaysBetween(today, shiftIsoDate(today, 400), templeLocationFrom(info, "Temple"));
}

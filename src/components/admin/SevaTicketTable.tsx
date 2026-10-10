import { Link } from "@/i18n/navigation";
import { setSevaBookingOpen } from "@/lib/actions/sevas";
import { formatSlot, isReleasedOn, type Seva } from "@/lib/seva-types";
import { formatIso, isoFromDate, parseIso, todayInIndia } from "@/lib/dates";

const FREQUENCY_LABEL = { nitya: "Nitya", weekly: "Weekly", monthly: "Monthly", annual: "Annual", special: "Darshan & special", request: "On request" } as const;
import { folderPath, type Folder } from "@/lib/folders";

// Open dates from today on (capped — only the count and first date are shown).
function upcomingOpenDates(seva: Seva, today: string) {
  if (!seva.releaseStartDate || !seva.releaseEndDate) return [];
  const out: string[] = [];
  const from = seva.releaseStartDate > today ? seva.releaseStartDate : today;
  for (const d = parseIso(from); isoFromDate(d) <= seva.releaseEndDate && out.length < 400; d.setDate(d.getDate() + 1)) {
    if (isReleasedOn(seva, isoFromDate(d))) out.push(isoFromDate(d));
  }
  return out;
}

export default function SevaTicketTable({
  sevas,
  folders,
  upcomingBookings,
}: {
  sevas: Seva[];
  folders: Folder[];
  upcomingBookings: Record<string, number>;
}) {
  const today = todayInIndia();

  if (sevas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
        <p className="font-medium text-ink">No sevas yet</p>
        <p className="mt-1 text-sm text-ink/55">Add your first seva — its timings and booking dates are all set on one page.</p>
        <Link href="/admin/sevas/new" className="mt-4 inline-block rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream">
          + Add a seva
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sevas.map((seva) => {
        const dates = upcomingOpenDates(seva, today);
        const slots = seva.slots.filter((s) => s.isActive);
        const status = !seva.isActive
          ? { label: "Bookings stopped", className: "bg-black/5 text-ink/55" }
          : dates.length === 0
            ? { label: "No open dates", className: "bg-amber-500/15 text-amber-800" }
            : { label: "Taking bookings", className: "bg-green-600/15 text-green-800" };
        const booked = upcomingBookings[seva.id] ?? 0;

        return (
          <article key={seva.id} className="flex flex-col rounded-2xl border border-ink/10 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg text-maroon">{seva.name.en}</h3>
                <p className="text-xs text-ink/50">
                  <span className="mr-1.5 rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-maroon">{FREQUENCY_LABEL[seva.frequency]}</span>
                  {seva.isListed ? "" : "Hidden from Sevas page · "}
                  {seva.price === 0 ? "Free" : `₹${seva.price}`}
                  {seva.folderId ? ` · ${folderPath(folders, seva.folderId)}` : ""}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-ink/50">Timings</dt>
                <dd className="text-ink/80">
                  {slots.length > 0
                    ? slots.map((s) => `${formatSlot(s, "en")} (${s.capacity})`).join(", ")
                    : `Any time · ${seva.capacityPerSlot} devotees/day`}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-ink/50">Dates</dt>
                <dd className="text-ink/80">
                  {dates.length > 0
                    ? `${dates.length} day${dates.length === 1 ? "" : "s"} open · from ${formatIso(dates[0], "en", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}`
                    : "None selected"}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-ink/50">Booked</dt>
                <dd className="text-ink/80">
                  {booked} ticket{booked === 1 ? "" : "s"} upcoming{" "}
                  {booked > 0 ? (
                    <Link href={`/admin/bookings?seva=${seva.id}`} className="ml-1 text-xs font-semibold text-maroon hover:underline">
                      View →
                    </Link>
                  ) : null}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
              <Link
                href={`/admin/sevas/${seva.id}/edit`}
                className="rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark"
              >
                Edit seva &amp; dates
              </Link>
              {seva.isActive ? (
                <form action={setSevaBookingOpen.bind(null, seva.id, false)}>
                  <button className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-black/[0.03]">
                    Stop bookings
                  </button>
                </form>
              ) : dates.length > 0 ? (
                <form action={setSevaBookingOpen.bind(null, seva.id, true)}>
                  <button className="rounded-full border border-green-700/30 px-4 py-2 text-xs font-semibold text-green-800 hover:bg-green-600/5">
                    Resume bookings
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

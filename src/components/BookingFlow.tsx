"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatSlot, isReleasedOn, type Seva, type SevaSlot } from "@/lib/seva-types";
import { MAX_TICKETS_PER_BOOKING, type BookedCounts } from "@/lib/content-types";
import { createBooking, getSevaAvailability, type CreateBookingResult } from "@/lib/actions/bookings";
import CategoryFilterBar from "@/components/CategoryFilterBar";
import AvailabilityCalendar, { selectedColors, statusColors, type DayStatus } from "@/components/booking/AvailabilityCalendar";
import ChakraLoader from "@/components/ChakraLoader";
import DevoteeFields, { emptyDevotee, fieldClass, type DevoteeDraft } from "@/components/booking/DevoteeFields";
import { formatIso, isoFromDate, localTodayIso, maxIso, parseIso } from "@/lib/dates";
import type { DevoteeProfile } from "@/lib/devotee/types";
import { buildFolderTree, filterByFolder, selectedFolderIds, type Folder } from "@/lib/folders";

type Confirmed = Extract<CreateBookingResult, { ok: true }>;

// First and last dates still bookable for a seva (null when none are left).
function bookableRange(seva: Seva, today: string) {
  if (!seva.releaseStartDate || !seva.releaseEndDate) return null;
  let first: string | null = null;
  for (const d = parseIso(maxIso(today, seva.releaseStartDate)!); isoFromDate(d) <= seva.releaseEndDate; d.setDate(d.getDate() + 1)) {
    if (isReleasedOn(seva, isoFromDate(d))) {
      first = isoFromDate(d);
      break;
    }
  }
  return first ? { first, last: seva.releaseEndDate } : null;
}

// A day is "filling fast" once 80% of its seats are gone.
function statusFor(left: number, total: number): DayStatus {
  if (left <= 0) return "full";
  return left <= Math.max(1, Math.ceil(total * 0.2)) ? "filling" : "available";
}

export default function BookingFlow({
  sevas,
  folders,
  profile,
}: {
  sevas: Seva[];
  folders: Folder[];
  /** Signed-in devotee's saved details, used to prefill the first devotee and phone. */
  profile?: DevoteeProfile | null;
}) {
  const t = useTranslations("booking");
  const tTicket = useTranslations("ticket");
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const today = localTodayIso();
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const ranges = useMemo(() => new Map(sevas.map((s) => [s.id, bookableRange(s, today)])), [sevas, today]);
  const initialSeva =
    sevas.find((s) => s.id === searchParams.get("seva"))?.id ?? sevas.find((s) => ranges.get(s.id))?.id ?? sevas[0]?.id ?? null;

  const [sevaId, setSevaId] = useState<string | null>(initialSeva);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [devotees, setDevotees] = useState<DevoteeDraft[]>(() =>
    Array.from({ length: MAX_TICKETS_PER_BOOKING }, (_, i) =>
      i === 0 && profile
        ? { name: profile.fullName, gotram: profile.gotram ?? "", nakshatram: profile.nakshatram ?? "" }
        : { ...emptyDevotee },
    ),
  );
  const [sameGotram, setSameGotram] = useState(true);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [tickets, setTickets] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [booked, setBooked] = useState<{ sevaId: string; counts: BookedCounts } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subfolderId, setSubfolderId] = useState<string | null>(null);

  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  // Only offer categories that actually contain an open seva.
  const usedTree = useMemo(
    () =>
      tree
        .map((c) => ({ ...c, subfolders: c.subfolders.filter((s) => sevas.some((sv) => sv.folderId === s.id)) }))
        .filter((c) => c.subfolders.length > 0 || sevas.some((sv) => sv.folderId === c.id)),
    [tree, sevas],
  );
  const visibleSevas = filterByFolder(sevas, selectedFolderIds(usedTree, categoryId, subfolderId));

  const seva = sevas.find((s) => s.id === sevaId) ?? null;
  const range = seva ? ranges.get(seva.id) ?? null : null;
  const counts = booked && booked.sevaId === sevaId ? booked.counts : null;
  const slots = seva?.slots ?? [];
  const slot = slots.find((s) => s.id === slotId) ?? null;

  useEffect(() => {
    if (!sevaId) return;
    let cancelled = false;
    getSevaAvailability(sevaId)
      .then((result) => {
        if (!cancelled) setBooked({ sevaId, counts: result });
      })
      .catch(() => {
        if (!cancelled) setBooked({ sevaId, counts: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [sevaId, refreshKey]);

  // Today's time slots close once they've started (the server enforces the same).
  const slotClosed = (s: SevaSlot, iso: string) => {
    if (iso !== today) return false;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return s.startTime <= hhmm;
  };
  const seatsLeft = (iso: string, s: SevaSlot | null) =>
    s
      ? Math.max(0, s.capacity - (counts?.[iso]?.[s.id] ?? 0))
      : Math.max(0, (seva?.capacityPerSlot ?? 0) - (counts?.[iso]?.["_"] ?? 0));

  const dayInfo = (iso: string): { status: DayStatus; left: number } => {
    if (!seva || iso < today || !isReleasedOn(seva, iso)) return { status: "closed", left: 0 };
    if (slots.length === 0) {
      const left = seatsLeft(iso, null);
      return { status: statusFor(left, seva.capacityPerSlot), left };
    }
    const open = slots.filter((s) => !slotClosed(s, iso));
    if (open.length === 0) return { status: "closed", left: 0 };
    const left = open.reduce((sum, s) => sum + seatsLeft(iso, s), 0);
    const total = open.reduce((sum, s) => sum + s.capacity, 0);
    return { status: statusFor(left, total), left };
  };

  function chooseSeva(id: string) {
    setSevaId(id);
    setDate(null);
    setSlotId(null);
    setError(null);
  }

  function chooseDate(iso: string) {
    setDate(iso);
    setSlotId(null);
    setError(null);
    // On phones the slots sit below the calendar — bring them into view.
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function chooseSlot(id: string) {
    setSlotId(id);
    setError(null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => formatIso(iso, locale, opts);
  const ready = !!seva && !!date && (slots.length === 0 || !!slot);
  // Up to 6 per booking, never more than the seats still free.
  const maxTickets = ready && date ? Math.min(MAX_TICKETS_PER_BOOKING, seatsLeft(date, slot)) : MAX_TICKETS_PER_BOOKING;
  const quantity = Math.min(tickets, Math.max(1, maxTickets));
  const totalPrice = (seva?.price ?? 0) * quantity;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!seva || !date) return;
    setSubmitting(true);
    setError(null);
    try {
      const sharedGotram = devotees[0].gotram;
      const result = await createBooking({
        sevaId: seva.id,
        date,
        slotId,
        phone,
        devotees: devotees.slice(0, quantity).map((d) => ({
          name: d.name,
          gotram: (sameGotram ? sharedGotram : d.gotram) || null,
          nakshatram: d.nakshatram || null,
        })),
      });
      if (result.ok) {
        setConfirmed(result);
      } else {
        setError(t(`errors.${result.error}`));
        if (["slot_full", "slot_unavailable", "slot_required", "date_unavailable"].includes(result.error)) {
          setSlotId(null);
          setRefreshKey((k) => k + 1);
        }
      }
    } catch {
      setError(t("errors.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sevas.length === 0) {
    return <p className="mt-8 rounded-2xl bg-cream-dark px-5 py-6 text-center text-sm text-ink/60">{t("noSevas")}</p>;
  }

  if (confirmed && seva && date) {
    const isPending = confirmed.status === "pending";
    return (
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-gold/30 bg-white/70 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon text-cream">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        </div>
        <p className="mt-4 font-display text-2xl text-maroon">{isPending ? t("pendingTitle") : t("confirmedTitle")}</p>
        <p className="mt-1 text-sm text-ink/70">
          {seva.name[locale]} &middot; {fmt(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {slot ? <> &middot; {formatSlot(slot, locale)}</> : null}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{t("ticketCount", { count: quantity })}</p>
        <p className="mt-1 text-sm text-ink/70">
          {devotees
            .slice(0, quantity)
            .map((d) => d.name.trim())
            .join(", ")}
        </p>
        <p className="mt-5 text-xs uppercase tracking-wide text-ink/50">{t("referenceLabel")}</p>
        <p className="font-mono text-3xl font-semibold tracking-widest text-maroon-dark">{confirmed.reference}</p>
        <p className="mt-5 rounded-xl bg-cream-dark px-4 py-3 text-sm text-ink/70">
          {isPending ? t("payAtCounterNote", { amount: confirmed.amount }) : t("freeConfirmedNote")}
        </p>
        <Link
          href={{ pathname: `/ticket/${confirmed.reference}`, query: { t: confirmed.ticketToken } }}
          className="mt-5 inline-block rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark"
        >
          {tTicket("viewTicket")}
        </Link>
        <Link href="/account" className="ml-3 mt-5 inline-block text-sm font-semibold text-maroon underline-offset-4 hover:underline">
          {t("myBookings")}
        </Link>
        <br />
        <button
          type="button"
          onClick={() => {
            setConfirmed(null);
            setDate(null);
            setSlotId(null);
            setRefreshKey((k) => k + 1);
          }}
          className="mt-6 text-sm font-semibold text-maroon hover:underline"
        >
          {t("bookAnother")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <CategoryFilterBar
        tree={usedTree}
        categoryId={categoryId}
        subfolderId={subfolderId}
        onChange={(cat, sub) => {
          setCategoryId(cat);
          setSubfolderId(sub);
        }}
        allLabel={t("filterAll")}
      />

      {/* Seva picker */}
      <div role="tablist" aria-label={t("step1")} className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {visibleSevas.map((s) => {
          const active = s.id === sevaId;
          const open = !!ranges.get(s.id);
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => chooseSeva(s.id)}
              className={`min-w-44 shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors ${
                active ? "border-maroon bg-maroon text-cream shadow-md" : "border-gold/30 bg-white/70 text-ink hover:border-maroon/40"
              }`}
            >
              <span className="block font-display text-base leading-tight">{s.name[locale]}</span>
              <span className={`mt-1 block text-xs ${active ? "text-cream/85" : "text-ink/55"}`}>
                {s.price === 0 ? t("priceFree") : `₹${s.price}`} · {open ? t("openForBooking") : t("notOpenYet")}
              </span>
            </button>
          );
        })}
      </div>

      {seva ? (
        <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="rounded-2xl border border-gold/25 bg-white/70 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg text-maroon">{seva.name[locale]}</p>
              <p className="text-sm font-semibold text-ink/70">{seva.price === 0 ? t("priceFree") : `₹${seva.price}`}</p>
            </div>
            {seva.description[locale] ? <p className="mt-1 text-sm text-ink/70">{seva.description[locale]}</p> : null}

            <div className="mt-4 flex flex-wrap items-start gap-6">
              {/* Calendar */}
              <div style={{ width: 360, maxWidth: "100%" }}>
                {!range ? (
                  <p className="rounded-xl bg-cream-dark px-4 py-6 text-center text-sm text-ink/60">{t("noDates")}</p>
                ) : counts === null ? (
                  <div className="grid h-72 place-items-center">
                    <ChakraLoader label={t("loadingSlots")} />
                  </div>
                ) : (
                  <AvailabilityCalendar
                    key={seva.id}
                    firstMonth={range.first}
                    lastMonth={range.last}
                    selected={date}
                    locale={locale}
                    dayStatus={(iso) => dayInfo(iso).status}
                    onSelect={chooseDate}
                  />
                )}
              </div>

              {/* Time slots for the chosen date */}
              <div ref={panelRef} className="scroll-mt-4" style={{ flex: "1 1 260px", minWidth: 0 }}>
                {!date ? (
                  <p className="rounded-xl bg-cream-dark px-4 py-8 text-center text-sm text-ink/60">{t("pickDateHint")}</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{t("selectedDate")}</p>
                    <p className="font-semibold text-ink">{fmt(date, { weekday: "long", day: "numeric", month: "long" })}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/50">{t("selectTime")}</p>
                    <div className="mt-2 grid" style={{ gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                      {slots.length > 0 ? (
                        slots.map((s) => {
                          const closed = slotClosed(s, date);
                          const left = seatsLeft(date, s);
                          const status: DayStatus = closed ? "closed" : statusFor(left, s.capacity);
                          return (
                            <SlotTile
                              key={s.id}
                              label={formatSlot(s, locale)}
                              note={closed ? t("slotClosed") : left === 0 ? t("legend.full") : t("availableCount", { count: left })}
                              status={status}
                              active={slotId === s.id}
                              onClick={() => chooseSlot(s.id)}
                            />
                          );
                        })
                      ) : (
                        <SlotTile
                          label={t("wholeDay")}
                          note={t("availableCount", { count: seatsLeft(date, null) })}
                          status={statusFor(seatsLeft(date, null), seva.capacityPerSlot)}
                          active
                          onClick={() => undefined}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Booking form — below the calendar */}
          {ready ? (
            <div ref={formRef} className="scroll-mt-4 rounded-2xl border border-gold/30 bg-white/80 p-4 shadow-sm sm:p-5">
              <p className="font-display text-lg text-maroon">{t("devotee.single")}</p>
              <p className="text-sm text-ink/60">
                {seva.name[locale]} · {fmt(date!, { weekday: "long", day: "numeric", month: "long" })}
                {slot ? <> · {formatSlot(slot, locale)}</> : null}
              </p>

              {/* Fields share one width so the phone box and devotee cards line up. */}
              <div className="max-w-3xl">
                <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-ink/70">{t("ticketsLabel")}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTickets(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        aria-label={t("fewerTickets")}
                        className="h-11 w-11 rounded-full border border-gold/40 bg-white text-lg font-semibold text-maroon hover:border-maroon/50 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-xl font-semibold text-ink" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTickets(Math.min(maxTickets, quantity + 1))}
                        disabled={quantity >= maxTickets}
                        aria-label={t("moreTickets")}
                        className="h-11 w-11 rounded-full border border-gold/40 bg-white text-lg font-semibold text-maroon hover:border-maroon/50 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-ink/50">{t("maxTicketsNote", { max: MAX_TICKETS_PER_BOOKING })}</p>
                  </div>
                  <div style={{ flex: "1 1 240px" }}>
                    <label className="text-sm font-medium text-ink/70" htmlFor="phone">
                      {t("phoneLabel")}
                    </label>
                    <input
                      id="phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      pattern="[0-9+ \-]{10,16}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <DevoteeFields
                    devotees={devotees}
                    count={quantity}
                    sameGotram={sameGotram}
                    locale={locale}
                    wide
                    onChange={(index, patch) => setDevotees((all) => all.map((d, i) => (i === index ? { ...d, ...patch } : d)))}
                    onSameGotramChange={setSameGotram}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 pt-4">
                <p className="text-sm text-ink/70">
                  {t("ticketCount", { count: quantity })}
                  {seva.price > 0 ? (
                    <>
                      {" "}
                      · ₹{seva.price} × {quantity} = <span className="font-semibold text-ink">₹{totalPrice}</span>
                    </>
                  ) : null}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-maroon px-8 py-3 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
                >
                  {submitting ? `${t("confirmCta")}…` : seva.price ? `${t("confirmCta")} · ₹${totalPrice}` : t("confirmCta")}
                </button>
              </div>
              {error ? <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            </div>
          ) : error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function SlotTile({
  label,
  note,
  status,
  active,
  onClick,
}: {
  label: string;
  note: string;
  status: DayStatus;
  active: boolean;
  onClick: () => void;
}) {
  const disabled = status === "closed" || status === "full";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      style={{
        borderWidth: active ? 2 : 1,
        borderStyle: "solid",
        borderRadius: 12,
        ...(active ? selectedColors : statusColors[status]),
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className="flex flex-col items-start px-3 py-2.5 text-left"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs" style={{ opacity: 0.85 }}>
        {note}
      </span>
    </button>
  );
}

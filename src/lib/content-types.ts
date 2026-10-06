// Plain types shared between the server data-fetchers (src/lib/data/*) and
// client components. Deliberately has no "server-only" imports so client
// bundles can import it directly.

export type LocalizedText = { en: string; kn: string };

export type TempleEvent = {
  id: string;
  title: LocalizedText;
  date: string; // ISO date
  description: LocalizedText;
  image: string | null;
  folderId: string | null;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

// One person on a booking — one per ticket. Gotram and nakshatram are
// optional (used for the sankalpam).
export type Devotee = { name: string; gotram: string | null; nakshatram: string | null };

export type Booking = {
  id: string;
  reference: string | null;
  sevaId: string;
  date: string;
  /** Time slot, e.g. "06:30–07:30"; null for whole-day bookings. */
  slot: { startTime: string; endTime: string | null } | null;
  devoteeName: string;
  phone: string;
  quantity: number;
  devotees: Devotee[];
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  /** Set when an admin scanned the ticket and marked darshan done — the QR is spent. */
  checkedInAt: string | null;
  /** Set when prasadam was handed over (same QR, after darshan) — the QR is then fully spent. */
  prasadamClaimedAt: string | null;
};

// Devotees can book up to this many tickets in one booking (also enforced
// by the create_booking database function).
export const MAX_TICKETS_PER_BOOKING = 6;

// Booked seats per date, split by time slot id ("_" = whole-day booking).
export type BookedCounts = Record<string, Record<string, number>>;

export type CommentStatus = "approved" | "hidden";

export type PublicComment = {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type AdminComment = PublicComment & {
  context: string;
  status: CommentStatus;
};

export type TempleTiming = { day: string; hours: string };

export type TempleInfo = {
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  mapsQuery: string;
  about: LocalizedText;
  timings: TempleTiming[];
};

export type NoticeKind = "update" | "ticket_release" | "event_reminder" | "alert";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: LocalizedText;
  body: LocalizedText;
  linkUrl: string | null;
  isPinned: boolean;
  publishOn: string;
  expiresOn: string | null;
  createdAt: string;
};

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
// "submitted": the devotee uploaded a UPI payment screenshot that the
// temple office hasn't verified yet.
export type PaymentStatus = "unpaid" | "submitted" | "paid" | "refunded";

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
  /** How it was paid ("upi" = devotee uploaded a payment screenshot). */
  paymentMethod: "upi" | "counter" | null;
  /** UPI transaction reference (UTR), typed by the devotee or read from the screenshot. */
  paymentUtr: string | null;
  paymentSubmittedAt: string | null;
  paymentReviewedAt: string | null;
  /** Office note on the payment, e.g. why a screenshot was rejected. */
  paymentNote: string | null;
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

export type TempleTiming = {
  day: string;
  dayKn?: string;
  // "HH:MM" 24-hour; `hours` is the English text kept for older readers.
  sessions?: { open: string; close: string }[];
  hours: string;
};

export type TempleInfo = {
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  mapsQuery: string;
  mapsUrl: string;
  // The temple's name and address as listed on Google Maps, and its
  // unique Google place ID.
  mapsPlace: string;
  mapsPlaceId: string;
  lat: number | null;
  lon: number | null;
  about: LocalizedText;
  timings: TempleTiming[];
};

// Admin-controlled site-wide settings (one row).
export type SiteSettings = {
  /** Background song for the website; null = the built-in chant. */
  backgroundAudioUrl: string | null;
  backgroundAudioTitle: string;
  upiId: string;
  upiNumber: string;
  upiPayeeName: string;
  upiQrUrl: string | null;
};

export const DEFAULT_BACKGROUND_AUDIO = "/audio/om-namo-narayanaya.mp3";

/** UPI details are complete enough to show devotees a way to pay. */
export const upiReady = (s: SiteSettings) => !!(s.upiId || s.upiNumber || s.upiQrUrl);

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

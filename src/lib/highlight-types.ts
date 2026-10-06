import type { LocalizedText } from "@/lib/content-types";

export type HighlightKind = "live" | "live_scheduled" | "alert" | "tickets" | "notice" | "event";

// One "What's new" card. Text comes from the content itself (notices,
// sevas, events) or, for the live stream, from the message files by kind.
export type Highlight = {
  id: string;
  kind: HighlightKind;
  href: string;
  title: LocalizedText | null;
  body: LocalizedText | null;
  /** ISO date the card is about (event day, first open date…). */
  date: string | null;
  image: string | null;
  /** Free text, e.g. the scheduled live time as the admin typed it. */
  detail: string | null;
  /** Added in the last few days — shown with a NEW badge and announced once. */
  isNew: boolean;
};

// Shared between the request form, the server action and the admin page.
// No server-only imports, so client components can use it.
import type { Devotee } from "@/lib/content-types";

export const REQUEST_OCCASIONS = ["birthday", "anniversary", "remembrance", "beginning", "other"] as const;
export type RequestOccasion = (typeof REQUEST_OCCASIONS)[number];

export const REQUEST_STATUSES = ["new", "contacted", "confirmed", "done", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type SevaRequest = {
  id: string;
  reference: string;
  sevaId: string | null;
  /** As the devotee saw it (or their own words for "another seva"). */
  sevaName: string;
  /** The listed seva's name in both languages, when it was one. */
  sevaTitle: { en: string; kn: string } | null;
  requestedDate: string;
  occasion: string;
  devotees: Devotee[];
  phone: string;
  email: string;
  note: string;
  locale: string;
  status: RequestStatus;
  officeNote: string;
  createdAt: string;
};

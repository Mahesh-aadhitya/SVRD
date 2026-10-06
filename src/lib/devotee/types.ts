export type DevoteeProfile = {
  fullName: string;
  email: string;
  phone: string;
  gotram: string | null;
  nakshatram: string | null;
};

export const DONATION_PURPOSES = ["general", "annadanam", "gau_seva", "renovation", "festival"] as const;
export type DonationPurpose = (typeof DONATION_PURPOSES)[number];
export type DonationStatus = "created" | "paid" | "failed";

export type Donation = {
  id: string;
  receiptNo: string;
  purpose: DonationPurpose;
  amount: number;
  donorName: string;
  phone: string;
  email: string;
  note: string | null;
  status: DonationStatus;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export const DONATION_PRESETS = [101, 251, 501, 1001, 2501, 5001];
export const MAX_DONATION = 1_000_000;

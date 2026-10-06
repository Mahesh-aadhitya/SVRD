"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getDevotee } from "@/lib/devotee/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId, verifyPaymentSignature } from "@/lib/razorpay";
import { DONATION_PURPOSES, MAX_DONATION } from "@/lib/devotee/types";
import { markDonationPaid } from "@/lib/devotee/donation-payments";

const donationSchema = z.object({
  purpose: z.enum(DONATION_PURPOSES),
  amount: z.number().int().min(1).max(MAX_DONATION),
  donorName: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\+?[0-9]{10,13}$/)),
  note: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
});

export type StartDonationResult =
  | {
      ok: true;
      orderId: string;
      keyId: string;
      amountPaise: number;
      receiptNo: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: "login" | "invalid" | "unavailable" | "failed" };

// Records the pledge, then opens a Razorpay order for exactly that amount.
// The donation only becomes "paid" once a signed payment for this order
// comes back (confirmDonation or the webhook).
export async function startDonation(input: {
  purpose: string;
  amount: number;
  donorName: string;
  phone: string;
  note: string;
}): Promise<StartDonationResult> {
  const devotee = await getDevotee();
  if (!devotee) return { ok: false, error: "login" };
  if (!razorpayConfigured()) return { ok: false, error: "unavailable" };
  const parsed = donationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { purpose, amount, donorName, phone, note } = parsed.data;

  const supabase = createAdminClient();
  let donation: { id: string; receipt_no: string } | null = null;
  for (let attempt = 0; attempt < 3 && !donation; attempt++) {
    const receiptNo = `D${randomBytes(5).toString("hex").toUpperCase().slice(0, 9)}`;
    const { data, error } = await supabase
      .from("donations")
      .insert({ receipt_no: receiptNo, user_id: devotee.id, purpose, amount, donor_name: donorName, phone, email: devotee.email, note })
      .select("id, receipt_no")
      .single();
    if (!error) donation = data;
    else if (error.code !== "23505") throw new Error(error.message);
  }
  if (!donation) return { ok: false, error: "failed" };

  try {
    const order = await createRazorpayOrder({
      amountPaise: amount * 100,
      receipt: donation.receipt_no,
      notes: { purpose, donation_id: donation.id },
    });
    await supabase.from("donations").update({ razorpay_order_id: order.id }).eq("id", donation.id);
    return {
      ok: true,
      orderId: order.id,
      keyId: razorpayKeyId(),
      amountPaise: order.amount,
      receiptNo: donation.receipt_no,
      prefill: { name: donorName, email: devotee.email, contact: phone },
    };
  } catch (e) {
    console.error("startDonation:", e);
    await supabase.from("donations").update({ status: "failed" }).eq("id", donation.id);
    return { ok: false, error: "failed" };
  }
}

export type ConfirmDonationResult = { ok: true; receiptNo: string } | { ok: false };

export async function confirmDonation(input: { orderId: string; paymentId: string; signature: string }): Promise<ConfirmDonationResult> {
  const devotee = await getDevotee();
  if (!devotee) return { ok: false };
  if (!verifyPaymentSignature(input.orderId, input.paymentId, input.signature)) return { ok: false };
  const receiptNo = await markDonationPaid(input.orderId, input.paymentId);
  return receiptNo ? { ok: true, receiptNo } : { ok: false };
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Razorpay through its REST API (no SDK): create an order server-side with
// the amount fixed here, let Checkout collect the payment in the browser,
// then trust only a verified signature — from the Checkout handler or the
// webhook — before marking anything paid.

export function razorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string };

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: input.notes ?? {} }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status}): ${await res.text()}`);
  return res.json();
}

function hmacMatches(secret: string, payload: string, signature: string) {
  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// Signature Checkout returns to the browser after a successful payment.
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return !!secret && hmacMatches(secret, `${orderId}|${paymentId}`, signature);
}

// X-Razorpay-Signature on webhook calls, over the raw request body.
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return !!secret && !!signature && hmacMatches(secret, rawBody, signature);
}

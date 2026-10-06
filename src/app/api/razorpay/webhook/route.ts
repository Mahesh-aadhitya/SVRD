import { verifyWebhookSignature } from "@/lib/razorpay";
import { markDonationPaid } from "@/lib/devotee/donation-payments";
import { createAdminClient } from "@/lib/supabase/admin";

// Razorpay → server confirmation, so a donation is recorded even if the
// devotee closes the browser before Checkout's success handler runs.
// Configure in Razorpay Dashboard → Webhooks with events payment.captured
// and payment.failed, and the same secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyWebhookSignature(body, request.headers.get("x-razorpay-signature"))) {
    return new Response("invalid signature", { status: 400 });
  }
  const event = JSON.parse(body) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string | null } } };
  };
  const payment = event.payload?.payment?.entity;
  if (payment?.order_id) {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      await markDonationPaid(payment.order_id, payment.id);
    } else if (event.event === "payment.failed") {
      await createAdminClient()
        .from("donations")
        .update({ status: "failed" })
        .eq("razorpay_order_id", payment.order_id)
        .eq("status", "created");
    }
  }
  return Response.json({ ok: true });
}

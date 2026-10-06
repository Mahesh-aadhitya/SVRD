import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Marks a donation paid from a Razorpay order + payment. Idempotent, and
// shared by the Checkout handler and the webhook. Deliberately not a
// server action: callers must verify the Razorpay signature first.
export async function markDonationPaid(orderId: string, paymentId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("donations")
    .select("receipt_no, status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (!existing) return null;
  if (existing.status !== "paid") {
    const { error } = await supabase
      .from("donations")
      .update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
      .eq("razorpay_order_id", orderId)
      .neq("status", "paid");
    if (error) throw new Error(error.message);
    revalidatePath("/[locale]/account", "page");
    revalidatePath("/[locale]/admin", "layout");
  }
  return existing.receipt_no;
}

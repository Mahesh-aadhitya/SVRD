// Razorpay Checkout in the browser, loaded only when someone presses Pay.

export type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: () => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

// Checkout options that put UPI first (cards, netbanking and wallets
// follow below it). With live keys the old "type your UPI ID" (collect)
// flow is hidden, as NPCI requires since 2026: Checkout then shows a UPI
// QR on computers and the UPI app buttons on phones. Test keys keep
// collect, so test payments can use success@razorpay.
export function upiFirst(keyId: string) {
  return {
    display: {
      blocks: { upi: { name: "Pay using UPI", instruments: [{ method: "upi" }] } },
      sequence: ["block.upi"],
      preferences: { show_default_blocks: true },
      ...(keyId.startsWith("rzp_live_") ? { hide: [{ method: "upi", flows: ["collect"] }] } : {}),
    },
  };
}

export function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

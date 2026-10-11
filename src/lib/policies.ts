// The website's policy pages (terms, privacy, refunds, delivery) — what
// payment gateways ask to see before taking payments. English only, as
// these are the texts reviewed by the gateway. `name` is the temple's name;
// `contact` its phone / email as entered in admin.

export const POLICY_SLUGS = ["terms", "privacy", "refunds", "delivery"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const POLICY_UPDATED = "11 October 2026";

type Section = { heading: string; body: string[] };
export type Policy = { title: string; sections: Section[] };

export function policy(slug: PolicySlug, name: string, contact: string): Policy {
  const reach = contact ? `the temple office (${contact})` : "the temple office";
  switch (slug) {
    case "terms":
      return {
        title: "Terms & Conditions",
        sections: [
          {
            heading: "About this website",
            body: [
              `This website is run by ${name} ("the temple", "we"). It lets devotees book sevas and poojas performed at the temple, make offerings, and read temple news, events and the panchangam.`,
              "By using this website or booking a seva, you agree to these terms.",
            ],
          },
          {
            heading: "Bookings",
            body: [
              "A booking is for the seva, date and (where offered) time slot shown on your ticket, for the number of devotees listed on it. Bookings are subject to availability.",
              "Prices are shown in Indian Rupees (₹) on each seva and are the full amount payable. A booking is confirmed once the payment is received; the ticket shows its payment status.",
              "Please give correct names, gotram, nakshatram and phone number — they are used to perform the seva and to reach you.",
              "Show your ticket (on your phone or printed) at the temple. Each ticket's QR code can be used once.",
            ],
          },
          {
            heading: "Payments",
            body: [
              "Online payments — UPI (Google Pay, PhonePe and other UPI apps), cards and netbanking — are processed securely by Razorpay. The temple does not see or store your card, UPI PIN or banking details.",
              "Bookings can also be paid at the temple counter.",
            ],
          },
          {
            heading: "Changes and cancellations",
            body: [
              "Paid bookings are not refunded but can be moved to another date — see the Refund & Cancellation Policy.",
              "In rare cases (festivals, unforeseen events) the temple may need to change or cancel a seva. You will then be offered another date or a full refund.",
            ],
          },
          {
            heading: "Use of the website",
            body: [
              "Please do not misuse the website, upload false payment proofs, or attempt to access other devotees' bookings. Bookings made with false payment details will be cancelled.",
              "Photos, songs and texts on this website belong to the temple or their respective owners and are shared for devotional use.",
            ],
          },
          {
            heading: "Governing law",
            body: [
              "These terms are governed by the laws of India. Any dispute is subject to the courts having jurisdiction over the temple's location.",
              `For any question about these terms, contact ${reach}.`,
            ],
          },
        ],
      };
    case "privacy":
      return {
        title: "Privacy Policy",
        sections: [
          {
            heading: "What we collect",
            body: [
              "Account details: your name, email address and phone number when you sign in with Google or an email code.",
              "Booking details: the devotees' names, gotram and nakshatram, the seva, date and amount.",
              "Payment details: the payment reference and status from Razorpay (and, for earlier bookings paid by UPI screenshot, that screenshot and its transaction ID). We never receive your card number, UPI PIN or bank password.",
            ],
          },
          {
            heading: "How we use it",
            body: [
              "To book and perform your seva, issue your ticket, confirm your payment, and contact you about your booking.",
              "The temple office and priest receive booking and payment notifications (by WhatsApp and email) for this purpose.",
              "We do not sell or share your details for advertising.",
            ],
          },
          {
            heading: "Who else handles it",
            body: [
              "Your data is stored with our hosting providers (Supabase and Vercel). Payments are handled by Razorpay under its own privacy policy. Sign-in with Google is handled by Google.",
            ],
          },
          {
            heading: "Cookies",
            body: ["We use cookies only to keep you signed in. We do not use advertising cookies."],
          },
          {
            heading: "Your choices",
            body: [
              `You can see your bookings under My bookings. To correct or delete your details, contact ${reach}. Booking and payment records may be kept as long as needed for the temple's accounts.`,
            ],
          },
        ],
      };
    case "refunds":
      return {
        title: "Refund & Cancellation Policy",
        sections: [
          {
            heading: "No refunds on seva bookings",
            body: ["Once a seva booking is paid, the amount is not refunded, including when you cannot attend."],
          },
          {
            heading: "Rescheduling",
            body: [
              `You can move a paid booking to another date before the booked date, subject to availability. Contact ${reach} with your booking reference, and the office will move it for you at no extra cost.`,
              "If the new seva or date costs more, the difference is payable.",
            ],
          },
          {
            heading: "If the temple cancels",
            body: [
              "If the temple has to cancel a seva, you can choose another date or a full refund. Refunds go back to the original payment method (the same UPI account, card or bank account) within 5–7 working days.",
            ],
          },
          {
            heading: "Duplicate or extra payments",
            body: [
              `If you were charged twice for the same booking, or paid more than the booking amount, contact ${reach} with the payment details. The extra amount is refunded to the original payment method within 5–7 working days.`,
            ],
          },
          {
            heading: "Offerings",
            body: ["Donations and offerings to the temple are not refundable, except a payment made twice by mistake."],
          },
        ],
      };
    case "delivery":
      return {
        title: "Shipping & Delivery Policy",
        sections: [
          {
            heading: "No physical shipping",
            body: ["The temple does not ship any goods. Everything booked on this website is a service performed at the temple."],
          },
          {
            heading: "Your ticket",
            body: [
              "Your e-ticket is issued on the website as soon as the booking is made, and stays available under My bookings and through the ticket link. Online payments are confirmed instantly.",
            ],
          },
          {
            heading: "The seva",
            body: [
              "The seva is performed at the temple on the booked date and time slot. Prasadam, where offered, is collected at the temple by showing your ticket.",
              `If you have not received your ticket, contact ${reach} with your phone number and payment details.`,
            ],
          },
        ],
      };
  }
}

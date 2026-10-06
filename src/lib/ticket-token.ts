import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// A ticket link carries an HMAC of the booking reference, so only the
// devotee who booked (or someone they share the link with) can open it —
// references alone can't be guessed into tickets with names and phones.
function secret() {
  const key = process.env.TICKET_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("TICKET_SIGNING_SECRET is not set");
  return key;
}

export function signTicket(reference: string): string {
  return createHmac("sha256", secret()).update(`ticket:${reference}`).digest("base64url").slice(0, 22);
}

export function verifyTicket(reference: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(signTicket(reference));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

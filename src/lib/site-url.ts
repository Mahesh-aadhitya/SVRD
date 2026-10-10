import "server-only";
import { headers } from "next/headers";

// This site's address as the current request reached it (or
// NEXT_PUBLIC_SITE_URL), for links that leave the page: ticket QR codes and
// emailed ticket links.
export async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

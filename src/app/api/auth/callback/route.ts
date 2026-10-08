import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getDevotee } from "@/lib/devotee/auth";
import { welcomeCookie } from "@/lib/welcome";

// Google sends the devotee back here (via Supabase) with a one-time code.
// Exchanging it sets the session cookies; then we create their profile on
// first sign-in, leave the welcome-greeting cookie and return them to the
// page they started from (the home page by default).
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";
  // Only same-site paths — never an open redirect to another host.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const loginError = new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin);

  if (!code) return NextResponse.redirect(loginError);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("auth callback:", error.message);
    return NextResponse.redirect(loginError);
  }

  const devotee = await getDevotee();
  const profile = devotee ? await ensureProfile(devotee).catch((e) => (console.error("ensureProfile:", e), null)) : null;
  const response = NextResponse.redirect(new URL(next, url.origin));
  if (devotee) {
    const welcome = welcomeCookie(profile?.fullName || devotee.name);
    response.cookies.set(welcome.name, welcome.value, welcome.options);
  }
  return response;
}

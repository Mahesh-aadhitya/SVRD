import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Optimistic check only: presence of a Supabase auth cookie, not a verified
// session. The authoritative check is verifyAdminSession()/requireAdmin() in
// src/lib/admin/dal.ts, called from the admin layout and every admin Server
// Action — this just avoids serving the admin shell to an obviously logged-out
// visitor before that check runs.
function hasSupabaseSession(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

// Keeps a signed-in session (admin or devotee) alive: when the access token
// has expired, getSession() swaps the refresh token for a new one and the
// fresh cookies go out on this response. Not an auth check — pages and
// actions verify the user themselves.
async function refreshSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getSession().catch(() => null);
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localePrefixMatch = pathname.match(/^\/(en|kn)(?=\/|$)/);
  const locale = localePrefixMatch ? localePrefixMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = localePrefixMatch
    ? pathname.slice(localePrefixMatch[0].length) || "/"
    : pathname;

  const isAdminRoute = pathWithoutLocale === "/admin" || pathWithoutLocale.startsWith("/admin/");
  const isLoginRoute =
    pathWithoutLocale === "/admin/login" || pathWithoutLocale.startsWith("/admin/login/");

  if (isAdminRoute && !isLoginRoute && !hasSupabaseSession(request)) {
    const loginPath = locale === routing.defaultLocale ? "/admin/login" : `/${locale}/admin/login`;
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const response = intlMiddleware(request);
  return hasSupabaseSession(request) ? refreshSession(request, response) : response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

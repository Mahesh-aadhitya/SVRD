// Right after a devotee signs in, the server leaves this short-lived cookie
// (holding their name) on the redirect; the site layout's WelcomeGreeting
// reads it once, deletes it and plays the greeting. Client-safe on purpose.
export const WELCOME_COOKIE = "sv_welcome";

export function welcomeCookie(name: string) {
  const short = name.includes("@") ? name.split("@")[0] : name;
  return {
    name: WELCOME_COOKIE,
    // Raw: Next.js URL-encodes cookie values itself (encoding here too
    // showed "Raghavendra%20A").
    value: short.trim().slice(0, 60),
    options: {
      path: "/",
      maxAge: 120,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    },
  };
}

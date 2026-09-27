import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "kn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // Disable automatic Accept-Language/cookie based redirects: devotees pick
  // their language with the in-app switcher, so "/" can always be statically
  // served as English instead of the middleware negotiating per-request.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

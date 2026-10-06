import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Derived from the env var (not hardcoded) so this keeps working if the
// Supabase project ever changes or moves to self-hosted, per the project's
// "content has to be stored and used fast, at any scale" requirement —
// without this, Next's Image optimizer rejects every Supabase Storage URL
// outright instead of resizing/caching it.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the home Wi-Fi (e.g. scanning a ticket QR)
  // load the dev server's scripts. No effect on production builds.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // YouTube thumbnails for gallery videos and past live darshans.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default withNextIntl(nextConfig);

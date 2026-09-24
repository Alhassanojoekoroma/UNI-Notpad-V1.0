import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` on style-src is required by Tailwind's runtime style
 * injection and by the inline styles shadcn/base-ui components emit for
 * positioning. `'unsafe-eval'` is dev-only — the Next.js dev overlay and React
 * Refresh need it, production does not.
 *
 * connect-src covers Google Generative AI (the study assistant streams from the
 * server, but the client also talks to same-origin SSE) and Cloudinary uploads.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://api.cloudinary.com",
  "frame-src 'self' https://res.cloudinary.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Keep development artifacts separate so `next build` cannot invalidate a
  // running dev server's RSC payloads and leave localhost unresponsive.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        },
        { key: "Content-Security-Policy", value: csp },
        // Only meaningful over HTTPS; harmless on localhost, which browsers
        // exempt from HSTS.
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "X-DNS-Prefetch-Control", value: "off" },
      ],
    },
    {
      // Never let an intermediary or the browser cache an API response —
      // several return per-user data.
      source: "/api/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
      ],
    },
  ],
};

export default nextConfig;

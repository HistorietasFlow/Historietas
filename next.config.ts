import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const allowedDevOrigins: NonNullable<NextConfig["allowedDevOrigins"]> = [
  "192.168.15.5",
  "192.168.15.5:3000",
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const supabaseCoverRemotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);

    if (url.protocol === "https:") {
      supabaseCoverRemotePatterns.push({
        protocol: "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/capas-obras/**",
      });
    }
  } catch {
    // A aplicação já trata Supabase ausente/inválido no cliente.
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: supabaseCoverRemotePatterns,
  },
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins }
    : {}),
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/uploading/bundler-plugin-options/

  org: "historietas",

  project: "historietas",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

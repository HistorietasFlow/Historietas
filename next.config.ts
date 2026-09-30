import type { NextConfig } from "next";

const allowedDevOrigins: NonNullable<NextConfig["allowedDevOrigins"]> = [
  "192.168.15.5",
  "192.168.15.5:3000",
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
  images: {
    remotePatterns: supabaseCoverRemotePatterns,
  },
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins }
    : {}),
};

export default nextConfig;

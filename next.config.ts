import type { NextConfig } from "next";

const allowedDevOrigins: NonNullable<NextConfig["allowedDevOrigins"]> = [
  "192.168.15.5",
  "192.168.15.5:3000",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.NODE_ENV === "development"
    ? { allowedDevOrigins }
    : {}),
};

export default nextConfig;
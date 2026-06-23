import type { NextConfig } from "next";

const allowedDevOrigins =
  process.env.NODE_ENV === "development"
    ? [
        "192.168.15.5",
        "192.168.15.5:3000",
        "http://192.168.15.5:3000",
      ]
    : [];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins,
};

export default nextConfig;
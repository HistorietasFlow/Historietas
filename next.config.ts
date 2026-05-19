import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.15.5",
    "192.168.15.5:3000",
    "http://192.168.15.5:3000",
  ],
};

export default nextConfig;
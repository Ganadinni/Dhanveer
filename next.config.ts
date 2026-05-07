import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensures Prisma client is not bundled into edge runtime
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;

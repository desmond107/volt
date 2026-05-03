import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@libsql/client"],
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;

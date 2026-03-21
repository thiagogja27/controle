import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Adiciona a flag para compatibilidade com OpenSSL
process.env.NODE_OPTIONS = "--openssl-legacy-provider";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);

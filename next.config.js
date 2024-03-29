/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "amazonaws.com",
      "arweave.net",
      "dweb.link",
      "nftstorage.link",
      "helius-rpc.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.arweave.net",
      },
      {
        protocol: "https",
        hostname: "**.dweb.link",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "**.helius-rpc.com",
      },
    ],
  },
  transpilePackages: ["react-tweet"],
};

module.exports = withBundleAnalyzer(nextConfig);

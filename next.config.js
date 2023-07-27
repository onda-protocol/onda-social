/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["amazonaws.com", "arweave.net", "dweb.link", "nftstorage.link"],
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
    ],
  },
  transpilePackages: ["react-tweet"],
};

module.exports = nextConfig;

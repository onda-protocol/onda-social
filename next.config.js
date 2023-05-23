/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "chickentribe.s3.us-west-2.amazonaws.com",
      "**.arweave.net",
      "**.dweb.link",
    ],
  },
};

module.exports = nextConfig;

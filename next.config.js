/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "chickentribe.s3.us-west-2.amazonaws.com",
      "arweave.net",
      "www.arweave.net",
      "dweb.link",
      "ipfs.dweb.link",
    ],
  },
};

module.exports = nextConfig;

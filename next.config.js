/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "localhost",
      "xjfibpldqlxrhlxzfzyn.supabase.co",
      "irpyuirjrcmovfsxttlo.supabase.co",
      "hkrgfqpshdoroimlulzw.supabase.co", // Make sure this exactly matches your Supabase URL
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**supabase.co",
        pathname: "/**",
      },
    ],
    // Add unoptimized option for direct URLs
    unoptimized: process.env.NODE_ENV === "development",
  },
};

module.exports = nextConfig;

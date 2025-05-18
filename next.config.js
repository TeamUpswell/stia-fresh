/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // Add your Supabase storage domain
      'hkrgfqpshdoroimlulzw.supabase.co',
      // Keep any other existing domains if present
    ],
  },
};

module.exports = nextConfig;

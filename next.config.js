/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // Your Supabase storage domain
      'hkrgfqpshdoroimlulzw.supabase.co',
      // Add any other image domains you need
    ],
  },
};

module.exports = nextConfig;

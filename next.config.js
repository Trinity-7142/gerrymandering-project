// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['100.85.96.73'],
  images: {
    qualities: [100],
  },
};

module.exports = nextConfig;

// TODO: Configure static export (output: 'export') for Vercel deployment
// TODO: Configure generateStaticParams for state and district routes
// TODO: Any image optimization settings for rep/senator headshots



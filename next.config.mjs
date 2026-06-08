/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg', '@prisma/adapter-pg', 'pg-connection-string', 'pgpass', 'groq-sdk'],
  },
};

export default nextConfig;

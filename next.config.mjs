/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the native SQLite addon out of the client/edge bundle — it must only
  // ever run in the Node.js server runtime used by the API route handlers.
  // (Next 14 key; renamed to top-level `serverExternalPackages` in Next 15.)
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;

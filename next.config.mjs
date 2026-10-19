/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The fixture loader is server-only; keeping it out of the client bundle is
  // structural, not a convention we have to remember.
  serverExternalPackages: ["openai"],
};

export default nextConfig;

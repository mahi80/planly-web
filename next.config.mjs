/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained build at .next/standalone for Dockerfile + Fargate.
  // Vercel ignores this; it builds against the source.
  output: "standalone",
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // The authoritative dataset is read from disk at runtime; make sure it is
    // traced into serverless bundles on hosted deployments.
    outputFileTracingIncludes: {
      "/**": ["./data/**"],
    },
  },
};

export default nextConfig;

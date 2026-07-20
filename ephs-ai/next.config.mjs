/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // pdf.js is a large, server-only dependency used for transcript text
    // extraction; keep it out of the webpack bundle and require it at runtime.
    serverComponentsExternalPackages: ["pdfjs-dist"],
    // The authoritative dataset is read from disk at runtime; make sure it is
    // traced into serverless bundles on hosted deployments.
    outputFileTracingIncludes: {
      "/**": ["./data/**"],
    },
  },
};

export default nextConfig;

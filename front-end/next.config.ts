import type { NextConfig } from "next";

/** Parse an absolute http(s) URL from an env var; `null` when unset/invalid. */
function parseUrl(value: string | undefined): URL | null {
  try {
    if (!value) return null;
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// Images are served by the Laravel back-end (`/storage/**`) or by the CDN that
// fronts its disk (MEDIA_PUBLIC_URL).
const apiUrl = parseUrl(process.env.API_URL ?? "http://localhost:8000/api/v1");
const mediaUrl = parseUrl(process.env.MEDIA_PUBLIC_URL);

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

for (const [url, pathname] of [
  [apiUrl, "/storage/**"],
  [mediaUrl, "/**"],
] as const) {
  if (!url) continue;
  remotePatterns.push({
    protocol: url.protocol.slice(0, -1) as "http" | "https",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
    pathname,
  });
}

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // The local back-end runs on localhost, which Next treats as a private IP.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;

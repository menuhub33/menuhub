export const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "menuhub.com";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? `https://app.${ROOT_DOMAIN}`;

export const RESTAURANT_COOKIE = "mh-restaurant-id";

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "dashboard",
  "mail",
  "support",
  "help",
  "blog",
  "docs",
  "status",
  "cdn",
  "static",
  "assets",
  "login",
  "signup",
  "register",
  "auth",
  "m",
  "onboarding",
  "demo",
]);

export function publicMenuHost(slug: string) {
  return `${slug}.${ROOT_DOMAIN}`;
}

export function publicMenuUrl(slug: string) {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";
  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT ?? "3000";
    return `${protocol}://localhost:${port}/m/${slug}`;
  }
  return `${protocol}://${publicMenuHost(slug)}`;
}

export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  if (host === "localhost" || host.endsWith(".localhost")) {
    const parts = host.split(".");
    if (parts.length >= 2 && parts[0] && parts[0] !== "localhost") {
      return parts[0];
    }
    return null;
  }

  const root = ROOT_DOMAIN.toLowerCase();
  if (host === root || host === `www.${root}`) return null;
  if (!host.endsWith(`.${root}`)) return null;

  const sub = host.slice(0, -(root.length + 1));
  if (!sub || sub.includes(".")) return null;
  return sub;
}

export function isReservedSubdomain(slug: string) {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

export function slugifyName(name: string) {
  const latin = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  if (latin.length >= 3) return latin;
  return `menu-${Math.random().toString(36).slice(2, 8)}`;
}

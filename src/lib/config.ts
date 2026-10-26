const COMPOUND_SUFFIXES = new Set([
  "com.sy",
  "net.sy",
  "org.sy",
  "edu.sy",
  "gov.sy",
  "co.uk",
  "org.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "com.br",
  "com.tr",
  "com.eg",
  "com.sa",
  "com.jo",
  "com.lb",
  "net.lb",
  "org.lb",
  "co.il",
  "org.il",
]);

export function configuredRootDomain() {
  const value = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  return value || null;
}

export const ROOT_DOMAIN = configuredRootDomain() ?? "";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? (ROOT_DOMAIN ? `https://app.${ROOT_DOMAIN}` : "");

export function hostnameOnly(host: string | null | undefined) {
  return (host ?? "").split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") ?? "";
}

export function registrableDomain(host: string | null | undefined) {
  const hostname = hostnameOnly(host).split(":")[0] ?? "";
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return null;

  const configured = configuredRootDomain();
  if (configured && (hostname === configured || hostname.endsWith(`.${configured}`))) {
    return configured;
  }

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 2) return configured;

  const suffix = labels.slice(-2).join(".");
  const rootLength = COMPOUND_SUFFIXES.has(suffix) ? 3 : 2;
  if (labels.length < rootLength) return configured;
  return labels.slice(-rootLength).join(".");
}

export function menuRootDomain(host?: string | null) {
  return configuredRootDomain() ?? registrableDomain(host);
}

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
  "demo-cars",
]);

export function publicMenuHost(slug: string, host?: string | null) {
  const root = menuRootDomain(host);
  return root ? `${slug}.${root}` : slug;
}

export function publicMenuUrl(
  slug: string,
  host?: string | null,
  protocol?: string | null
) {
  const raw = hostnameOnly(host);
  const hostname = raw.split(":")[0] ?? "";
  const port = raw.includes(":") ? raw.split(":").slice(1).join(":") : "";
  const local =
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1";

  if (local) {
    const configured = configuredRootDomain();
    if (process.env.NODE_ENV === "production" && configured) {
      return `https://${slug}.${configured}`;
    }
    const localPort = port || process.env.PORT || "3000";
    return `http://localhost:${localPort}/m/${slug}`;
  }

  const root = menuRootDomain(hostname);
  if (!root) return `/m/${slug}`;
  const scheme = protocol?.split(",")[0]?.trim() === "http" ? "http" : "https";
  return `${scheme}://${slug}.${root}`;
}

export function extractSubdomain(hostname: string): string | null {
  const host = hostnameOnly(hostname).split(":")[0] ?? "";
  if (!host || host === "localhost") return null;
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, -".localhost".length);
    if (!label || label.includes(".")) return null;
    return label;
  }

  const root = menuRootDomain(host);
  if (!root || host === root || host === `www.${root}`) return null;
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

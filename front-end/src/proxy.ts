import { NextResponse, type NextRequest } from "next/server";
import { API_URL } from "@/core/api/config";
import {
  extractSubdomain,
  hostnameOnly,
  isReservedSubdomain,
  RESTAURANT_COOKIE,
} from "@/core/config";
import { TOKEN_COOKIE } from "@/core/auth/token";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/auth"];
// Reachable while signed in (the first one clears a token the API rejected).
const AUTH_EXEMPT = ["/auth/expired", "/verify-email", "/reset-password"];

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/** Custom domains (menu.example.com) are mapped to a slug by the API. */
async function resolveCustomDomain(host: string): Promise<string | null> {
  const appHost = (() => {
    try {
      return process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null;
    } catch {
      return null;
    }
  })();

  // Only production-like setups have an app host to compare against.
  if (!appHost || !host || host === appHost || host === "localhost") return null;

  try {
    const response = await fetch(`${API_URL}/public/resolve-host?host=${encodeURIComponent(host)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { slug?: string } };
    return body.data?.slug ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (request.headers.has("next-action") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get("host") ?? "";

  // Public menus are served from tenant sub-domains and never need a session.
  const subdomain = extractSubdomain(rawHost);
  if (subdomain && !isReservedSubdomain(subdomain)) {
    const url = request.nextUrl.clone();
    url.pathname = `/m/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if (!subdomain) {
    const hostname = hostnameOnly(rawHost).split(":")[0] ?? "";
    const slug = await resolveCustomDomain(hostname);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/m/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const protectedPath = matches(pathname, PROTECTED_PREFIXES);
  const authPath = matches(pathname, AUTH_PATHS);
  if (!protectedPath && !authPath) return NextResponse.next();

  // Presence check only: the API validates the token on every call, and the
  // guards in `core/auth/authorization.ts` send rejected tokens to /auth/expired.
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  if (protectedPath && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasToken && authPath && !matches(pathname, AUTH_EXEMPT)) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    const goingToRegister = pathname === "/register" || pathname.startsWith("/register/");
    url.pathname = goingToRegister
      ? "/onboarding"
      : next?.startsWith("/") && !next.startsWith("//") && !matches(next, AUTH_PATHS)
        ? next
        : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  const restaurantId = request.nextUrl.searchParams.get("restaurant");
  if (restaurantId && pathname.startsWith("/dashboard")) {
    response.cookies.set(RESTAURANT_COOKIE, restaurantId, { path: "/", sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|m/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)",
  ],
};

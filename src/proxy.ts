import { NextResponse, type NextRequest } from "next/server";
import {
  extractSubdomain,
  isReservedSubdomain,
  RESTAURANT_COOKIE,
} from "@/lib/config";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth",
];

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/admin"];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (request.headers.has("next-action") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public menus are served from tenant subdomains and never need a session,
  // so resolve them before paying for an auth round-trip.
  const subdomain = extractSubdomain(request.headers.get("host") ?? "");
  if (subdomain && !isReservedSubdomain(subdomain)) {
    const url = request.nextUrl.clone();
    url.pathname = `/m/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // `updateSession` calls the Supabase auth server over the network. Only pages
  // whose rendering depends on the session are worth that cost.
  if (!isProtectedPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (user && isAuthPath(pathname) && pathname !== "/verify-email") {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    const goingToRegister =
      pathname === "/register" || pathname.startsWith("/register/");
    url.pathname = goingToRegister
      ? "/onboarding"
      : next?.startsWith("/") && !next.startsWith("//") && !isAuthPath(next)
        ? next
        : "/dashboard";
    url.search = "";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  const restaurantId = request.nextUrl.searchParams.get("restaurant");
  if (restaurantId && pathname.startsWith("/dashboard")) {
    supabaseResponse.cookies.set(RESTAURANT_COOKIE, restaurantId, {
      path: "/",
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|m/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)",
  ],
};

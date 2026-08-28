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

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some(
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
  if (request.headers.has("next-action") || request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname);

  if (subdomain && !isReservedSubdomain(subdomain)) {
    const url = request.nextUrl.clone();
    url.pathname = `/m/${subdomain}${pathname === "/" ? "" : pathname}`;
    return copyCookies(supabaseResponse, NextResponse.rewrite(url));
  }

  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return copyCookies(supabaseResponse, NextResponse.redirect(url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return copyCookies(supabaseResponse, NextResponse.redirect(url));
    }
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
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)",
  ],
};

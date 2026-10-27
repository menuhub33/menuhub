import { NextResponse, type NextRequest } from "next/server";
import { clearToken } from "@/core/auth/token";

export const dynamic = "force-dynamic";

/**
 * Clears a session token the API no longer accepts (expired, revoked or the
 * account was suspended) and sends the visitor to the login page.
 */
export async function GET(request: NextRequest) {
  await clearToken();

  const next = request.nextUrl.searchParams.get("next");
  const reason = request.nextUrl.searchParams.get("reason");

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (reason === "suspended") url.searchParams.set("error", "suspended");
  else if (next?.startsWith("/") && !next.startsWith("//")) url.searchParams.set("next", next);

  return NextResponse.redirect(url);
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseCookieOptions } from "@/lib/supabase/cookies";

function supabaseCookiePrefix() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-`;
  } catch {
    return null;
  }
}

function pruneStaleAuthCookies(request: NextRequest, response: NextResponse) {
  const prefix = supabaseCookiePrefix();
  if (!prefix) return;

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && !cookie.name.startsWith(prefix)) {
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      ...supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  pruneStaleAuthCookies(request, supabaseResponse);

  return { supabase, supabaseResponse, user };
}

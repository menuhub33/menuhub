import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { supabaseCookieOptions } from "@/lib/supabase/cookies";

// Cached per request: every action/page shares one client instead of rebuilding
// it (and re-reading cookies) dozens of times per render.
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      ...supabaseCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll() ?? [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; can be ignored if a proxy
            // refreshes user sessions.
          }
        },
      },
    }
  );
});

// `auth.getUser()` is a network call to the Supabase auth server. Without this
// cache a single page render fires one per server action it touches.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user;
});

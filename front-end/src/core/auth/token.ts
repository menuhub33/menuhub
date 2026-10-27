import { cookies } from "next/headers";

/** httpOnly cookie holding the Laravel Sanctum bearer token. */
export const TOKEN_COOKIE = "mh_token";

/** Matches the 30 day expiry configured in `back-end/config/sanctum.php`. */
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

/** Server Actions and Route Handlers only. */
export async function setToken(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

/** Server Actions and Route Handlers only. */
export async function clearToken() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

import { redirect } from "next/navigation";

export default async function AuthResetAlias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Keep `token` and `email` from the reset link.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/reset-password?${query}` : "/reset-password");
}

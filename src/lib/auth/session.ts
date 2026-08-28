import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type AuthSession = {
  user: User;
  profile: Profile;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export const getSession = cache(async (): Promise<AuthSession | null> => {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      user,
      profile: {
        id: user.id,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ?? null,
        phone: (user.user_metadata?.phone as string | undefined) ?? null,
        avatar_url: null,
        platform_role: "USER",
        is_active: true,
        created_at: user.created_at,
        updated_at: user.created_at,
      },
      supabase,
    };
  }

  return { user, profile: profile as Profile, supabase };
});

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getUserRole() {
  const session = await getSession();
  return session?.profile.platform_role ?? null;
}

export type PlatformRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email: string;
  email_verified_at?: string | null;
  platform_role: PlatformRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

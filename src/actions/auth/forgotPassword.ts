"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";

export async function forgotPassword(
  email: string
): Promise<ActionResult<{ success: true }>> {
  const value = email?.trim().toLowerCase();
  if (!value) return fail("البريد الإلكتروني مطلوب");

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(value, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    if (error.status === 429) {
      return fail("محاولات كثيرة. يرجى الانتظار ثم المحاولة مرة أخرى");
    }
    return fail("تعذر إرسال رابط الاستعادة. حاول مرة أخرى");
  }

  return ok({ success: true });
}

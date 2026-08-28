"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";

export async function resetPassword(
  password: string
): Promise<ActionResult<{ success: true }>> {
  if (!password || password.length < 8) {
    return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail("تعذر تحديث كلمة المرور. أعد فتح رابط الاستعادة");

  return ok({ success: true });
}

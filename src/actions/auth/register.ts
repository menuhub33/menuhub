"use server";

import { fail, ok, type ActionResult } from "@/lib/action";

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  restaurant_name?: string;
};

export async function register(
  input: RegisterInput
): Promise<ActionResult<{ userId: string; needsEmailVerification: boolean }>> {
  const email = input.email?.trim().toLowerCase();
  const fullName = input.full_name?.trim();

  if (!email || !input.password || !fullName) {
    return fail("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة");
  }

  if (input.password.length < 8) {
    return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: fullName,
        phone: input.phone?.trim() || null,
        restaurant_name: input.restaurant_name?.trim() || null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return fail("هذا البريد الإلكتروني مسجّل مسبقاً");
    }
    if (message.includes("rate")) {
      return fail("محاولات كثيرة. يرجى الانتظار ثم المحاولة مرة أخرى");
    }
    return fail("تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى");
  }
  if (!data.user) return fail("تعذر إنشاء الحساب");

  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
    })
    .eq("id", data.user.id);

  return ok({
    userId: data.user.id,
    needsEmailVerification: !data.session,
  });
}

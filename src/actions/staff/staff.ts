"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import type { RestaurantRole } from "@/lib/types";
import type { StaffMember } from "@/components/lib/types";

export async function getStaff(
  restaurantId: string
): Promise<ActionResult<StaffMember[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض أعضاء هذا المطعم");

  const { data, error } = await auth.supabase
    .from("restaurant_users")
    .select("*, profile:profiles(id, full_name, phone, avatar_url, platform_role)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as StaffMember[]);
}

export async function inviteStaff(input: {
  restaurant_id: string;
  email: string;
  role: RestaurantRole;
}): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const email = input.email?.trim().toLowerCase();
  if (!input.restaurant_id || !email) return fail("المطعم والبريد مطلوبان");
  if (input.role === "OWNER") return fail("لا يمكن دعوة مالك إضافي");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه دعوة الموظفين");
  }

  if (!hasServiceRole()) {
    return fail("دعوة الموظفين تتطلب إعداد مفتاح الخدمة على الخادم");
  }

  const admin = createAdminClient();
  const { data: listed } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  let userId = listed.users.find((item) => item.email?.toLowerCase() === email)?.id;

  if (!userId) {
    const invited = await admin.auth.admin.inviteUserByEmail(email, {
      data: { invited_restaurant_id: input.restaurant_id },
    });
    if (invited.error || !invited.data.user) {
      return fail(invited.error?.message ?? "تعذر إرسال الدعوة");
    }
    userId = invited.data.user.id;
  }

  const { error } = await auth.supabase.from("restaurant_users").insert({
    restaurant_id: input.restaurant_id,
    user_id: userId,
    role: input.role,
    is_active: true,
  });
  if (error) return fail(error.message);
  return ok({ success: true });
}

export async function removeStaff(input: {
  id: string;
  restaurant_id: string;
}): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إزالة الموظفين");
  }

  const { data: current } = await auth.supabase
    .from("restaurant_users")
    .select("user_id, role")
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .maybeSingle();

  if (!current) return fail("العضو غير موجود");
  if (current.user_id === auth.user.id) {
    return fail("لا يمكنك إزالة نفسك");
  }
  if (current.role === "OWNER") {
    return fail("لا يمكن إزالة مالك المطعم");
  }

  const { error } = await auth.supabase
    .from("restaurant_users")
    .delete()
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id);

  if (error) return fail(error.message);
  return ok({ success: true });
}

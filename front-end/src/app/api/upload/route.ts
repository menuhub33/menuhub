import { NextResponse } from "next/server";

import { ApiError, apiData } from "@/core/api/client";
import { getActiveMembership } from "@/core/auth/authorization";
import { getToken } from "@/core/auth/token";

/**
 * Browser -> Next -> Laravel upload bridge.
 * The browser never sees the Sanctum token; this route attaches it and adds the
 * active restaurant so the backend can authorise the upload.
 */
export async function POST(request: Request) {
  if (!(await getToken())) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = incoming.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.set("file", file);
  outgoing.set("folder", String(incoming.get("folder") || "uploads"));

  const membership = await getActiveMembership().catch(() => null);
  if (membership) outgoing.set("restaurant_id", membership.restaurant.id);

  try {
    const stored = await apiData<{ url: string; card_url?: string }>("/uploads", {
      method: "POST",
      formData: outgoing,
    });
    return NextResponse.json({ url: stored.url, card_url: stored.card_url });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: "تعذر رفع الصورة" }, { status: 502 });
  }
}

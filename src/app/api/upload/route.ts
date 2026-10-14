import { storeUploadedImage } from "@/lib/image-objects";
import { optimizeImage } from "@/lib/optimize-image";
import { deleteR2Object, putR2Object } from "@/lib/r2";
import { isUploadFileLike } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "تعذر قراءة الملف" }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads");
  if (!isUploadFileLike(file)) {
    return Response.json({ error: "الملف مطلوب" }, { status: 400 });
  }

  const stored = await storeUploadedImage(
    { folder, userId: user.id, file },
    {
      env: process.env,
      putObject: putR2Object,
      deleteObject: deleteR2Object,
      optimize: optimizeImage,
    }
  );
  if ("error" in stored) {
    return Response.json({ error: stored.error }, { status: stored.status });
  }

  return Response.json({ url: stored.url });
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import {
  IMAGES_BUCKET,
  MAX_IMAGE_BYTES,
  isUploadFileLike,
  resolveImageMime,
  sanitizeStorageFolder,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicFileUrl(request: Request, objectPath: string) {
  const origin = new URL(request.url).origin;
  return `${origin}/images/${objectPath}`;
}

async function saveToDisk(objectPath: string, bytes: Buffer) {
  const diskPath = path.join(process.cwd(), "public", "images", ...objectPath.split("/"));
  await mkdir(path.dirname(diskPath), { recursive: true });
  await writeFile(diskPath, bytes);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = sanitizeStorageFolder(String(formData.get("folder") ?? "uploads"));
  if (!isUploadFileLike(file) || file.size === 0) {
    return Response.json({ error: "الملف مطلوب" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت" },
      { status: 400 }
    );
  }

  const resolved = resolveImageMime(file);
  if (!resolved) {
    return Response.json(
      { error: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP." },
      { status: 400 }
    );
  }

  const objectPath = `${folder}/${user.id}/${crypto.randomUUID()}.${resolved.ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    await supabase.rpc("ensure_images_bucket");
    const uploaded = await supabase.storage.from(IMAGES_BUCKET).upload(objectPath, bytes, {
      upsert: false,
      contentType: resolved.mime,
      cacheControl: "3600",
    });
    if (!uploaded.error) {
      const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(objectPath);
      if (data.publicUrl) {
        return Response.json({ url: data.publicUrl });
      }
    }
  } catch {
    // Storage is optional; files still save under public/images.
  }

  await saveToDisk(objectPath, bytes);
  return Response.json({ url: publicFileUrl(request, objectPath) });
}

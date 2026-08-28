"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import {
  IMAGES_BUCKET,
  MAX_IMAGE_BYTES,
  isUploadFileLike,
  mapStorageError,
  resolveImageMime,
  sanitizeStorageFolder,
} from "@/lib/storage";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

let imagesBucketReady = false;

async function ensurePublicImagesBucket(client: SupabaseClient) {
  if (imagesBucketReady) return;

  const { data } = await client.storage.getBucket(IMAGES_BUCKET);
  if (data) {
    if (!data.public) {
      await client.storage.updateBucket(IMAGES_BUCKET, { public: true });
    }
    imagesBucketReady = true;
    return;
  }

  const { error } = await client.storage.createBucket(IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
  imagesBucketReady = true;
}

export async function uploadImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const file = formData.get("file");
  const folder = sanitizeStorageFolder(String(formData.get("folder") ?? "uploads"));
  const fallbackType = String(formData.get("contentType") ?? "");
  const fallbackName = String(formData.get("filename") ?? "");
  if (!isUploadFileLike(file) || file.size === 0) {
    return fail("الملف مطلوب");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("حجم الصورة يجب ألا يتجاوز 5 ميغابايت");
  }

  const resolved = resolveImageMime(file, fallbackType, fallbackName);
  if (!resolved) {
    return fail("نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.");
  }

  const path = `${folder}/${auth.user.id}/${crypto.randomUUID()}.${resolved.ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const useAdmin = hasServiceRole();
  const storageClient = useAdmin ? createAdminClient() : auth.supabase;

  await auth.supabase.rpc("ensure_images_bucket");
  if (useAdmin) {
    try {
      await ensurePublicImagesBucket(storageClient);
    } catch {
      return fail("تعذر تجهيز مجلد الصور. نفّذ ملف 00008_ensure_images_bucket.sql في Supabase");
    }
  }

  const { error } = await storageClient.storage.from(IMAGES_BUCKET).upload(path, bytes, {
    upsert: false,
    contentType: resolved.mime,
    cacheControl: "3600",
  });
  if (error) return fail(mapStorageError(error.message));

  const { data } = storageClient.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) return fail("تعذر إنشاء رابط الصورة");
  return ok({ url: data.publicUrl });
}

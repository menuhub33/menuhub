"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import { storeUploadedImage } from "@/lib/image-objects";
import { optimizeImage } from "@/lib/optimize-image";
import { deleteR2Object, putR2Object } from "@/lib/r2";
import { isUploadFileLike } from "@/lib/storage";

export async function uploadImage(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads");
  const fallbackType = String(formData.get("contentType") ?? "");
  const fallbackName = String(formData.get("filename") ?? "");
  if (!isUploadFileLike(file)) return fail("الملف مطلوب");

  const stored = await storeUploadedImage(
    {
      folder,
      userId: auth.user.id,
      file,
      fallbackType,
      fallbackName,
    },
    {
      env: process.env,
      putObject: putR2Object,
      deleteObject: deleteR2Object,
      optimize: optimizeImage,
    }
  );
  if ("error" in stored) return fail(stored.error);
  return ok({ url: stored.url });
}

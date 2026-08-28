import { MAX_IMAGE_BYTES, resolveImageMime } from "@/lib/storage";

export async function uploadImageFile(
  file: File,
  folder = "uploads"
): Promise<{ data: { url: string }; error: null } | { data: null; error: string }> {
  if (!file || file.size === 0) return { data: null, error: "الملف مطلوب" };
  if (file.size > MAX_IMAGE_BYTES) {
    return { data: null, error: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت" };
  }
  if (!resolveImageMime(file)) {
    return { data: null, error: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP." };
  }

  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  });

  let payload: { url?: string; error?: string } = {};
  try {
    payload = (await response.json()) as { url?: string; error?: string };
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.url) {
    return { data: null, error: payload.error || "تعذر رفع الصورة" };
  }
  return { data: { url: payload.url }, error: null };
}

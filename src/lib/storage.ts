export const IMAGES_BUCKET = "images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export type UploadFileLike = {
  size: number;
  type?: string;
  name?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function isUploadFileLike(value: unknown): value is UploadFileLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UploadFileLike).arrayBuffer === "function" &&
    typeof (value as UploadFileLike).size === "number"
  );
}

export function resolveImageMime(
  file: { type?: string; name?: string },
  fallbackType?: string,
  fallbackName?: string
): { mime: string; ext: string } | null {
  const type = (file.type || fallbackType || "").toLowerCase();
  const fromType = MIME_TO_EXT[type];
  if (fromType) {
    return { mime: type === "image/jpg" ? "image/jpeg" : type, ext: fromType };
  }

  const ext = (file.name || fallbackName || "").split(".").pop()?.toLowerCase();
  if (ext && EXT_TO_MIME[ext]) {
    return { mime: EXT_TO_MIME[ext], ext: ext === "jpeg" ? "jpg" : ext };
  }

  return null;
}

export function mapStorageError(message: string) {
  const value = message.toLowerCase();
  if (
    value.includes("bucket") ||
    value.includes("not found") ||
    value.includes("does not exist") ||
    value.includes("404")
  ) {
    return "مجلد الصور غير موجود. نفّذ ملف 00008_ensure_images_bucket.sql في Supabase";
  }
  if (
    value.includes("row-level security") ||
    value.includes("unauthorized") ||
    value.includes("403") ||
    value.includes("access denied")
  ) {
    return "لا توجد صلاحية لرفع الصور. نفّذ ملف 00008_ensure_images_bucket.sql في Supabase";
  }
  if (value.includes("mime") || value.includes("not allowed")) {
    return "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.";
  }
  if (value.includes("maximum") || value.includes("too large") || value.includes("payload")) {
    return "حجم الصورة يجب ألا يتجاوز 5 ميغابايت";
  }
  return message || "تعذر رفع الصورة";
}

export function sanitizeStorageFolder(folder: string) {
  const cleaned = folder
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part && part !== "." && part !== ".." && part !== IMAGES_BUCKET)
    .join("/");

  return cleaned || "uploads";
}

export function isOpenableImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/images/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseStoredImageUrl(
  url: string | null | undefined,
  required = false
): { url: string | null; error: string | null } {
  if (url == null || url.trim() === "") {
    return required
      ? { url: null, error: "رابط الصورة مطلوب" }
      : { url: null, error: null };
  }

  const trimmed = url.trim();
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return { url: null, error: "يجب رفع الصورة أولاً قبل الحفظ" };
  }
  if (!isOpenableImageUrl(trimmed)) {
    return { url: null, error: "رابط الصورة غير صالح" };
  }
  return { url: trimmed, error: null };
}

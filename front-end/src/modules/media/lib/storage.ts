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
      ? { url: null, error: "ط±ط§ط¨ط· ط§ظ„طµظˆط±ط© ظ…ط·ظ„ظˆط¨" }
      : { url: null, error: null };
  }

  const trimmed = url.trim();
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return { url: null, error: "ظٹط¬ط¨ ط±ظپط¹ ط§ظ„طµظˆط±ط© ط£ظˆظ„ط§ظ‹ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸" };
  }
  if (!isOpenableImageUrl(trimmed)) {
    return { url: null, error: "ط±ط§ط¨ط· ط§ظ„طµظˆط±ط© ط؛ظٹط± طµط§ظ„ط­" };
  }
  return { url: trimmed, error: null };
}

import { PRODUCT_CARD_SUFFIX } from "./image-sizes";
import type { OptimizedImage } from "./optimize-image";
import { MAX_IMAGE_BYTES, resolveImageMime, sanitizeStorageFolder } from "./storage";

const IMAGE_FOLDERS = ["products", "categories", "logos", "covers", "uploads"] as const;
const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "gif"] as const;

export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

const UUID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const MANAGED_KEY = new RegExp(
  `^(${IMAGE_FOLDERS.join("|")})/${UUID}/${UUID}\\.(${IMAGE_EXTENSIONS.join("|")})$`,
  "i"
);

export const R2_NOT_CONFIGURED_ERROR = "تخزين الصور غير مُعد على الخادم.";
export const UPLOAD_FAILED_ERROR = "تعذر رفع الصورة. حاول مرة أخرى.";
export const IMAGE_PROCESS_ERROR = "تعذر معالجة الصورة. استخدم صورة JPG أو PNG أو WebP.";

export type R2Env = {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
};

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

export type UploadOutcome =
  | { url: string }
  | { error: string; status: number };

function required(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readR2Config(env: R2Env | NodeJS.ProcessEnv): R2Config | null {
  const source = env as R2Env;
  const accountId = required(source.R2_ACCOUNT_ID);
  const accessKeyId = required(source.R2_ACCESS_KEY_ID);
  const secretAccessKey = required(source.R2_SECRET_ACCESS_KEY);
  const bucket = required(source.R2_BUCKET_NAME);
  const publicUrl = required(source.R2_PUBLIC_URL);
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,62}$/i.test(bucket)) return null;

  try {
    const url = new URL(publicUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function r2Endpoint(accountId: string) {
  return `https://${accountId.trim()}.r2.cloudflarestorage.com`;
}

export function resolveUploadFolder(folder: string): ImageFolder {
  const segments = sanitizeStorageFolder(folder).toLowerCase().split("/");
  if (segments.includes("products")) return "products";
  if (segments.includes("categories")) return "categories";
  if (segments.includes("logos") || segments.includes("logo")) return "logos";
  if (segments.includes("covers") || segments.includes("cover")) return "covers";
  return "uploads";
}

export function normalizeObjectKey(objectKey: string) {
  const cleaned = objectKey.replace(/\\/g, "/").trim().replace(/^\/+|\/+$/g, "");
  if (!cleaned || cleaned.includes("//")) return null;
  const parts = cleaned.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return null;
  return parts.join("/");
}

export function isManagedObjectKey(objectKey: string) {
  return MANAGED_KEY.test(objectKey);
}

export function buildObjectKey(
  folder: string,
  userId: string,
  fileId: string,
  ext: string
) {
  const key = `${resolveUploadFolder(folder)}/${userId}/${fileId}.${ext.toLowerCase()}`;
  return isManagedObjectKey(key) ? key : null;
}

export function productCardObjectKey(objectKey: string) {
  if (!isManagedObjectKey(objectKey) || !objectKey.toLowerCase().endsWith(".webp")) return null;
  if (!objectKey.startsWith("products/")) return null;
  return objectKey.replace(/\.webp$/i, `${PRODUCT_CARD_SUFFIX}.webp`);
}

export function objectKeysToDelete(objectKey: string) {
  const cardKey = productCardObjectKey(objectKey);
  return cardKey ? [objectKey, cardKey] : [objectKey];
}

export function buildPublicObjectUrl(publicBase: string, objectKey: string) {
  let base: URL;
  try {
    base = new URL(publicBase.trim());
  } catch {
    return null;
  }
  if (base.protocol !== "https:" && base.protocol !== "http:") return null;

  const key = normalizeObjectKey(objectKey);
  if (!key || !isManagedObjectKey(key)) return null;

  const encoded = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const prefix = base.pathname.replace(/\/+$/, "");
  return `${base.origin}${prefix}/${encoded}`;
}

export function objectKeyFromPublicUrl(publicBase: string, imageUrl: string) {
  let base: URL;
  let image: URL;
  try {
    base = new URL(publicBase.trim());
    image = new URL(imageUrl.trim());
  } catch {
    return null;
  }
  if (image.origin !== base.origin) return null;

  const basePath = base.pathname.replace(/\/+$/, "");
  if (basePath && !image.pathname.startsWith(`${basePath}/`)) return null;

  const remainder = image.pathname.slice(basePath.length).replace(/^\/+/, "");
  let decoded: string;
  try {
    decoded = remainder
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }

  const key = normalizeObjectKey(decoded);
  if (!key || !isManagedObjectKey(key)) return null;
  return key;
}

export function shouldDeleteUnreferencedObject(referenceCounts: Array<number | null>) {
  return referenceCounts.length > 0 && referenceCounts.every((count) => count === 0);
}

export function validateImageUpload(
  file: { size: number; type?: string; name?: string } | null | undefined,
  fallbackType?: string,
  fallbackName?: string
): { ok: true; mime: string; ext: string } | { ok: false; error: string; status: number } {
  if (!file || file.size <= 0) {
    return { ok: false, error: "الملف مطلوب", status: 400 };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت",
      status: 400,
    };
  }

  const resolved = resolveImageMime(file, fallbackType, fallbackName);
  if (!resolved) {
    return {
      ok: false,
      error: "نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP.",
      status: 400,
    };
  }

  return { ok: true, mime: resolved.mime, ext: resolved.ext };
}

type UploadFile = {
  size: number;
  type?: string;
  name?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export async function storeUploadedImage(
  input: {
    folder: string;
    userId: string;
    file: UploadFile;
    fallbackType?: string;
    fallbackName?: string;
  },
  deps: {
    env: R2Env | NodeJS.ProcessEnv;
    putObject: (
      config: R2Config,
      objectKey: string,
      bytes: Buffer,
      contentType: string
    ) => Promise<void>;
    deleteObject?: (config: R2Config, objectKey: string) => Promise<void>;
    optimize?: (bytes: Buffer, folder: ImageFolder) => Promise<OptimizedImage>;
    randomId?: () => string;
  }
): Promise<UploadOutcome> {
  const validated = validateImageUpload(
    input.file,
    input.fallbackType,
    input.fallbackName
  );
  if (!validated.ok) return { error: validated.error, status: validated.status };

  const config = readR2Config(deps.env);
  if (!config) return { error: R2_NOT_CONFIGURED_ERROR, status: 503 };

  const objectKey = buildObjectKey(
    input.folder,
    input.userId,
    deps.randomId?.() ?? crypto.randomUUID(),
    "webp"
  );
  if (!objectKey) return { error: "تعذر تجهيز مسار الصورة", status: 400 };

  const url = buildPublicObjectUrl(config.publicUrl, objectKey);
  if (!url) return { error: R2_NOT_CONFIGURED_ERROR, status: 503 };

  let optimized: OptimizedImage;
  try {
    const bytes = Buffer.from(await input.file.arrayBuffer());
    const optimize =
      deps.optimize ?? (await import("./optimize-image")).optimizeImage;
    optimized = await optimize(bytes, resolveUploadFolder(input.folder));
  } catch {
    return { error: IMAGE_PROCESS_ERROR, status: 400 };
  }

  const uploaded: string[] = [];
  try {
    const cardKey = optimized.card ? productCardObjectKey(objectKey) : null;
    if (cardKey && optimized.card) {
      await deps.putObject(config, cardKey, optimized.card, optimized.mime);
      uploaded.push(cardKey);
    }
    await deps.putObject(config, objectKey, optimized.main, optimized.mime);
  } catch {
    if (deps.deleteObject) {
      for (const key of uploaded) {
        try {
          await deps.deleteObject(config, key);
        } catch {
          // The failed upload must not leave a public card image behind.
        }
      }
    }
    return { error: UPLOAD_FAILED_ERROR, status: 502 };
  }

  return { url };
}

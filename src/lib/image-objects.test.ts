import assert from "node:assert/strict";
import test from "node:test";
import { isOpenableImageUrl } from "./storage";
import {
  IMAGE_PROCESS_ERROR,
  R2_NOT_CONFIGURED_ERROR,
  UPLOAD_FAILED_ERROR,
  buildObjectKey,
  buildPublicObjectUrl,
  objectKeyFromPublicUrl,
  objectKeysToDelete,
  readR2Config,
  resolveUploadFolder,
  r2Endpoint,
  shouldDeleteUnreferencedObject,
  storeUploadedImage,
  validateImageUpload,
} from "./image-objects";
import { productSrcSet } from "./image-display";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const FILE_ID = "22222222-2222-4222-8222-222222222222";
const PUBLIC_BASE = "https://pub.example.r2.dev";
const SUPABASE_URL =
  "https://example.supabase.co/storage/v1/object/public/images/logos/old.jpg";

const configuredEnv = {
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-value",
  R2_BUCKET_NAME: "menuhub-images",
  R2_PUBLIC_URL: `${PUBLIC_BASE}/`,
};

function optimizedWebp(withCard = false) {
  return async () => ({
    main: Buffer.from("main"),
    card: withCard ? Buffer.from("card") : undefined,
    mime: "image/webp" as const,
    ext: "webp" as const,
  });
}

function file(overrides: { size?: number; type?: string; name?: string } = {}) {
  return {
    size: overrides.size ?? 4,
    type: overrides.type ?? "image/png",
    name: overrides.name ?? "photo.png",
    async arrayBuffer() {
      return new Uint8Array([1, 2, 3, 4]).buffer;
    },
  };
}

test("accepts the image types used by the app and rejects other files", () => {
  assert.deepEqual(validateImageUpload(file({ type: "image/jpeg", name: "a.jpg" })).ok, true);
  assert.deepEqual(validateImageUpload(file({ type: "image/png" })).ok, true);
  assert.deepEqual(validateImageUpload(file({ type: "image/webp", name: "a.webp" })).ok, true);
  assert.deepEqual(validateImageUpload(file({ type: "", name: "scan.jpeg" })).ok, true);
  assert.equal(validateImageUpload(file({ type: "image/svg+xml", name: "a.svg" })).ok, false);
  assert.equal(validateImageUpload(file({ type: "text/plain", name: "a.txt" })).ok, false);
  assert.equal(validateImageUpload(null).ok, false);
});

test("rejects images larger than 5MB", () => {
  const result = validateImageUpload(file({ size: 5 * 1024 * 1024 + 1 }));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 400);
    assert.match(result.error, /5/);
  }
});

test("missing R2 settings fail before any upload", async () => {
  let called = false;
  const result = await storeUploadedImage(
    { folder: "products", userId: USER_ID, file: file() },
    {
      env: {},
      putObject: async () => {
        called = true;
      },
      randomId: () => FILE_ID,
    }
  );
  assert.equal(called, false);
  assert.deepEqual(result, { error: R2_NOT_CONFIGURED_ERROR, status: 503 });
  assert.equal(readR2Config({ R2_ACCOUNT_ID: "account", R2_BUCKET_NAME: "menuhub-images" }), null);
});

test("upload failures return a generic error", async () => {
  const result = await storeUploadedImage(
    { folder: "logos", userId: USER_ID, file: file() },
    {
      env: configuredEnv,
      optimize: optimizedWebp(false),
      putObject: async () => {
        throw new Error("AccessDenied secret-value bucket=menuhub-images");
      },
      randomId: () => FILE_ID,
    }
  );
  assert.deepEqual(result, { error: UPLOAD_FAILED_ERROR, status: 502 });
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
  assert.equal(JSON.stringify(result).includes("AccessDenied"), false);
});

test("builds a public URL without duplicated slashes", async () => {
  let storedKey = "";
  const result = await storeUploadedImage(
    { folder: "restaurants/abc/products", userId: USER_ID, file: file({ type: "image/webp", name: "dish.webp" }) },
    {
      env: configuredEnv,
      optimize: optimizedWebp(true),
      putObject: async (_config, objectKey) => {
        storedKey = objectKey;
      },
      randomId: () => FILE_ID,
    }
  );

  const expectedKey = `products/${USER_ID}/${FILE_ID}.webp`;
  assert.equal(storedKey, expectedKey);
  assert.deepEqual(result, { url: `${PUBLIC_BASE}/${expectedKey}` });
  assert.equal(result && "url" in result ? result.url.includes("//products") : false, false);
});

test("encodes object key segments and keeps the original extension", () => {
  const key = buildObjectKey("covers", USER_ID, FILE_ID, "jpg");
  assert.equal(key, `covers/${USER_ID}/${FILE_ID}.jpg`);
  assert.equal(
    buildPublicObjectUrl(`${PUBLIC_BASE}/`, key ?? ""),
    `${PUBLIC_BASE}/covers/${USER_ID}/${FILE_ID}.jpg`
  );
  assert.equal(objectKeyFromPublicUrl(PUBLIC_BASE, `${PUBLIC_BASE}/covers/${USER_ID}/${FILE_ID}.jpg`), key);
});

test("maps upload folders and ignores path traversal", () => {
  assert.equal(resolveUploadFolder("categories"), "categories");
  assert.equal(resolveUploadFolder("logos"), "logos");
  assert.equal(resolveUploadFolder("../logos"), "logos");
  assert.equal(resolveUploadFolder("restaurants/abc"), "uploads");
  assert.equal(buildObjectKey("../products", USER_ID, FILE_ID, "png"), `products/${USER_ID}/${FILE_ID}.png`);
  assert.equal(buildObjectKey("products", "../etc", FILE_ID, "png"), null);
  assert.equal(buildObjectKey("products", USER_ID, FILE_ID, "svg"), null);
});

test("keeps legacy Supabase and local image URLs addressable and undeletable", () => {
  assert.equal(isOpenableImageUrl(SUPABASE_URL), true);
  assert.equal(isOpenableImageUrl("/images/logos/old.png"), true);
  assert.equal(objectKeyFromPublicUrl(PUBLIC_BASE, SUPABASE_URL), null);
  assert.equal(objectKeyFromPublicUrl(PUBLIC_BASE, "/images/logos/old.png"), null);
  assert.equal(objectKeyFromPublicUrl(PUBLIC_BASE, `${PUBLIC_BASE}/private/notes.txt`), null);
  assert.equal(shouldDeleteUnreferencedObject([0, 0, 0]), true);
  assert.equal(shouldDeleteUnreferencedObject([0, 1, 0]), false);
  assert.equal(shouldDeleteUnreferencedObject([0, null]), false);
});

test("uses the account S3 endpoint without embedding the secret", () => {
  const endpoint = r2Endpoint("account-id");
  assert.equal(endpoint, "https://account-id.r2.cloudflarestorage.com");
  assert.equal(endpoint.includes("secret"), false);
});

test("stores a phone-sized WebP and a smaller product card", async () => {
  const keys: string[] = [];
  const result = await storeUploadedImage(
    { folder: "products", userId: USER_ID, file: file({ type: "image/jpeg", name: "camera.jpg" }) },
    {
      env: configuredEnv,
      optimize: optimizedWebp(true),
      putObject: async (_config, objectKey, bytes, contentType) => {
        keys.push(`${objectKey}:${contentType}:${bytes.toString()}`);
      },
      randomId: () => FILE_ID,
    }
  );
  const mainKey = `products/${USER_ID}/${FILE_ID}.webp`;
  assert.deepEqual(keys, [
    `products/${USER_ID}/${FILE_ID}@640.webp:image/webp:card`,
    `${mainKey}:image/webp:main`,
  ]);
  assert.deepEqual(result, { url: `${PUBLIC_BASE}/${mainKey}` });
});

test("processing failures stay generic", async () => {
  const result = await storeUploadedImage(
    { folder: "products", userId: USER_ID, file: file() },
    {
      env: configuredEnv,
      optimize: async () => {
        throw new Error("sharp: unsupported libvips path");
      },
      putObject: async () => {
        throw new Error("should not upload");
      },
      randomId: () => FILE_ID,
    }
  );
  assert.deepEqual(result, { error: IMAGE_PROCESS_ERROR, status: 400 });
  assert.equal(JSON.stringify(result).includes("libvips"), false);
});

test("deletes the product card variant with the main object and leaves old urls alone", () => {
  const mainKey = `products/${USER_ID}/${FILE_ID}.webp`;
  assert.deepEqual(objectKeysToDelete(mainKey), [
    mainKey,
    `products/${USER_ID}/${FILE_ID}@640.webp`,
  ]);
  assert.deepEqual(objectKeysToDelete(`logos/${USER_ID}/${FILE_ID}.webp`), [
    `logos/${USER_ID}/${FILE_ID}.webp`,
  ]);
  assert.equal(objectKeyFromPublicUrl(PUBLIC_BASE, SUPABASE_URL), null);
  assert.equal(productSrcSet(SUPABASE_URL), null);
  assert.equal(productSrcSet("/images/products/old.jpg"), null);
  assert.equal(
    productSrcSet(`${PUBLIC_BASE}/${mainKey}`),
    `${PUBLIC_BASE}/products/${USER_ID}/${FILE_ID}@640.webp 640w, ${PUBLIC_BASE}/${mainKey} 1080w`
  );
});

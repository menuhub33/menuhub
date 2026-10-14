import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { PRODUCT_CARD_WIDTH, PRODUCT_IMAGE_WIDTH } from "./image-sizes";
import { optimizeImage } from "./optimize-image";

test("converts a large photo to a phone-sized WebP", async () => {
  const width = 2400;
  const height = 1800;
  const pixels = Buffer.alloc(width * height * 3);
  for (let index = 0; index < pixels.length; index += 1) {
    pixels[index] = (index * 17) % 256;
  }
  const jpeg = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();

  const optimized = await optimizeImage(jpeg, "products");
  const main = await sharp(optimized.main).metadata();
  const card = await sharp(optimized.card ?? Buffer.alloc(0)).metadata();

  assert.equal(optimized.mime, "image/webp");
  assert.equal(optimized.ext, "webp");
  assert.equal(main.format, "webp");
  assert.ok((main.width ?? 0) <= PRODUCT_IMAGE_WIDTH);
  assert.ok((main.height ?? 0) <= PRODUCT_IMAGE_WIDTH);
  assert.equal(main.width, PRODUCT_IMAGE_WIDTH);
  assert.equal(card.format, "webp");
  assert.equal(card.width, PRODUCT_CARD_WIDTH);
  assert.ok(optimized.main.length < jpeg.length);
  assert.ok((optimized.card?.length ?? 0) < optimized.main.length);
});

test("does not enlarge a small logo", async () => {
  const png = await sharp({
    create: { width: 120, height: 80, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
  const optimized = await optimizeImage(png, "logos");
  const meta = await sharp(optimized.main).metadata();
  assert.equal(optimized.card, undefined);
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 120);
  assert.equal(meta.height, 80);
});

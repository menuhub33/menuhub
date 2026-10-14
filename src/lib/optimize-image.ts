import sharp from "sharp";
import {
  IMAGE_LIMITS,
  PRODUCT_CARD_WIDTH,
  type SizedImageFolder,
} from "./image-sizes";

const CARD_QUALITY = 70;

export type OptimizedImage = {
  main: Buffer;
  card?: Buffer;
  mime: "image/webp";
  ext: "webp";
};

async function toWebp(bytes: Buffer, maxEdge: number, quality: number) {
  return sharp(bytes, {
    failOn: "none",
    animated: false,
    limitInputPixels: 80_000_000,
  })
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

export async function optimizeImage(
  bytes: Buffer,
  folder: SizedImageFolder
): Promise<OptimizedImage> {
  const profile = IMAGE_LIMITS[folder];
  const main = await toWebp(bytes, profile.maxEdge, profile.quality);
  const card =
    folder === "products"
      ? await toWebp(bytes, PRODUCT_CARD_WIDTH, CARD_QUALITY)
      : undefined;

  return { main, card, mime: "image/webp", ext: "webp" };
}

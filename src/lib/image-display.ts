import {
  PRODUCT_CARD_SUFFIX,
  PRODUCT_CARD_WIDTH,
  PRODUCT_IMAGE_WIDTH,
} from "./image-sizes";

const PRODUCT_WEBP =
  /\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

export function productCardUrl(src: string) {
  try {
    const url = new URL(src);
    if (!PRODUCT_WEBP.test(url.pathname)) return null;
    url.pathname = url.pathname.replace(/\.webp$/i, `${PRODUCT_CARD_SUFFIX}.webp`);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function productSrcSet(src: string) {
  const card = productCardUrl(src);
  if (!card) return null;
  return `${card} ${PRODUCT_CARD_WIDTH}w, ${src} ${PRODUCT_IMAGE_WIDTH}w`;
}

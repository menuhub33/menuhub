export const PRODUCT_IMAGE_WIDTH = 1080;
export const PRODUCT_CARD_WIDTH = 640;
export const PRODUCT_CARD_SUFFIX = `@${PRODUCT_CARD_WIDTH}`;

export const IMAGE_LIMITS = {
  products: { maxEdge: PRODUCT_IMAGE_WIDTH, quality: 75 },
  categories: { maxEdge: 720, quality: 75 },
  logos: { maxEdge: 512, quality: 82 },
  covers: { maxEdge: 1440, quality: 74 },
  uploads: { maxEdge: 1440, quality: 74 },
} as const;

export type SizedImageFolder = keyof typeof IMAGE_LIMITS;

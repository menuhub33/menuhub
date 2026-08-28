import type { ProductWithRelations } from "@/components/lib/types";

export function productPrimaryImageUrl(product: ProductWithRelations): string | null {
  const images = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  return images[0]?.image_url ?? null;
}

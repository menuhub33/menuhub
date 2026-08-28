import { cn } from "@/components/lib/cn";
import type { ProductWithRelations } from "@/components/lib/types";
import { PublicProductCard } from "@/components/public-menu/public-product-card";

export function PublicProductGrid({
  products,
  onProductOpen,
  quantities,
  onQuantityChange,
  className,
}: {
  products: ProductWithRelations[];
  onProductOpen?: (product: ProductWithRelations) => void;
  quantities?: Record<string, number>;
  onQuantityChange?: (productId: string, next: number) => void;
  className?: string;
}) {
  const visible = products.filter((product) => product.status !== "HIDDEN");

  if (visible.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {visible.map((product) => (
        <PublicProductCard
          key={product.id}
          product={product}
          onClick={onProductOpen ? () => onProductOpen(product) : undefined}
          quantity={quantities?.[product.id] ?? 0}
          onQuantityChange={
            onQuantityChange
              ? (next) => onQuantityChange(product.id, next)
              : undefined
          }
        />
      ))}
    </div>
  );
}

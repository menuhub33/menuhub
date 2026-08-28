import type { CategoryWithProducts, ProductWithRelations } from "@/components/lib/types";
import { PublicCategoryHeader } from "@/components/public-menu/public-category-header";
import { PublicProductGrid } from "@/components/public-menu/public-product-grid";

export function PublicCategory({
  category,
  onProductOpen,
}: {
  category: CategoryWithProducts;
  onProductOpen?: (product: ProductWithRelations) => void;
}) {
  const products = [...(category.products ?? [])]
    .filter((product) => product.status !== "HIDDEN")
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section id={category.id} className="scroll-mt-16 py-5">
      <PublicCategoryHeader category={category} />
      {products.length === 0 ? (
        <p className="text-sm opacity-60">لا توجد منتجات في هذا القسم بعد.</p>
      ) : (
        <PublicProductGrid products={products} onProductOpen={onProductOpen} />
      )}
    </section>
  );
}

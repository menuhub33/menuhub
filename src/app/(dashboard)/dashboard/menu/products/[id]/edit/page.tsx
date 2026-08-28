import { getMenuCatalog } from "@/actions/catalog/getCatalog";
import { ProductEditorView } from "@/components/views/product-editor-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/menu/products/[id]/edit">) {
  const { id } = await params;
  const tenant = await requirePermission("products.update");
  const catalog = await getMenuCatalog(tenant.restaurant.id);
  if (catalog.error) return <ErrorState description={catalog.error} />;
  const categories = catalog.data?.categories ?? [];
  const product = categories
    .flatMap((category) => category.products ?? [])
    .find((item) => item.id === id);
  if (!product) notFound();
  return (
    <ProductEditorView
      product={product}
      categories={categories}
      restaurantId={tenant.restaurant.id}
    />
  );
}

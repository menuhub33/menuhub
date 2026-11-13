import { getProductImageCap } from "@/modules/billing/actions/billing";
import { getMenuCatalog } from "@/modules/catalog/actions/catalog";
import { ProductEditorView } from "@/modules/catalog/views/product-editor-view";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { getProductCost } from "@/modules/catalog/actions/products";
import { ErrorState } from "@/core/components/common/error-state";
import { notFound } from "next/navigation";
import { normalizeBusinessType, showsStockCount } from "@/modules/tenancy/lib/business-type";

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/menu/products/[id]/edit">) {
  const { id } = await params;
  const tenant = await requirePermission("products.update");
  const [catalog, imageCap] = await Promise.all([
    getMenuCatalog(tenant.restaurant.id),
    getProductImageCap(tenant.restaurant.id),
  ]);
  if (catalog.error) return <ErrorState description={catalog.error} />;
  const categories = catalog.data?.categories ?? [];
  const product = categories
    .flatMap((category) => category.products ?? [])
    .find((item) => item.id === id);
  if (!product) notFound();

  // The catalog listing never carries costs; owners and managers load it separately.
  const canEditCost = hasPermission(tenant.role, "reports.sales");
  const cost = canEditCost ? await getProductCost(id) : null;

  return (
    <ProductEditorView
      canEditCost={canEditCost}
      product={canEditCost ? { ...product, cost_price: cost?.data ?? null } : product}
      categories={categories}
      restaurantId={tenant.restaurant.id}
      maxImages={imageCap.data ?? 4}
      showStockCount={showsStockCount(normalizeBusinessType(tenant.restaurant.business_type))}
    />
  );
}

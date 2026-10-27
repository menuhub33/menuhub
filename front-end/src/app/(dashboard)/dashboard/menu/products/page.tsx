import { getMenuCatalog } from "@/modules/catalog/actions/catalog";
import { ProductsView } from "@/modules/catalog/views/products-view";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";

export default async function ProductsPage() {
  const tenant = await requirePermission("products.view");
  const catalog = await getMenuCatalog(tenant.restaurant.id);
  if (catalog.error) return <ErrorState description={catalog.error} />;
  const categories = catalog.data?.categories ?? [];
  const products = categories.flatMap((category) => category.products ?? []);

  return (
    <ProductsView
      products={products}
      categories={categories}
      canEdit={hasPermission(tenant.role, "products.update")}
      canDelete={hasPermission(tenant.role, "products.delete")}
    />
  );
}

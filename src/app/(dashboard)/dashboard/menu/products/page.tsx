import { getMenuCatalog } from "@/actions/catalog/getCatalog";
import { ProductsView } from "@/components/views/products-view";
import { requirePermission } from "@/lib/auth/authorization";
import { hasPermission } from "@/lib/auth/permissions";
import { ErrorState } from "@/components/common/error-state";

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

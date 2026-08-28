import { getMenuCatalog } from "@/actions/catalog/getCatalog";
import { ProductEditorView } from "@/components/views/product-editor-view";
import { requirePermission } from "@/lib/auth/authorization";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewProductPage() {
  const tenant = await requirePermission("products.create");
  const catalog = await getMenuCatalog(tenant.restaurant.id);
  if (catalog.error) return <ErrorState description={catalog.error} />;
  const categories = catalog.data?.categories ?? [];
  if (categories.length === 0) {
    return (
      <EmptyState
        title="أضف قسماً أولاً"
        description="لا يمكن إنشاء منتج بدون قسم."
        action={
          <Link href="/dashboard/menu/categories">
            <Button>إنشاء قسم</Button>
          </Link>
        }
      />
    );
  }
  return (
    <ProductEditorView categories={categories} restaurantId={tenant.restaurant.id} />
  );
}

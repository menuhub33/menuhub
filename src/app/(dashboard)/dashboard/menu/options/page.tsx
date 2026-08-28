import { getMenuCatalog } from "@/actions/catalog/getCatalog";
import { OptionsView } from "@/components/views/options-view";
import { requirePermission } from "@/lib/auth/authorization";
import { hasPermission } from "@/lib/auth/permissions";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OptionsPage() {
  const tenant = await requirePermission("options.manage");
  const catalog = await getMenuCatalog(tenant.restaurant.id);
  if (catalog.error) return <ErrorState description={catalog.error} />;
  const products = catalog.data?.categories?.flatMap((category) => category.products ?? []) ?? [];
  if (products.length === 0) {
    return (
      <EmptyState
        title="أضف منتجاً أولاً"
        description="الخيارات ترتبط بالمنتجات مثل الحجم والإضافات."
        action={
          <Link href="/dashboard/menu/products/new">
            <Button>إضافة منتج</Button>
          </Link>
        }
      />
    );
  }
  const groups = products.flatMap((product) =>
    (product.option_groups ?? []).map((group) => ({ ...group, product }))
  );
  return (
    <OptionsView
      groups={groups}
      products={products}
      canEdit={hasPermission(tenant.role, "options.manage")}
    />
  );
}

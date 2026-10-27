import { getCategory } from "@/modules/catalog/actions/categories";
import { getDefaultMenu } from "@/modules/catalog/actions/catalog";
import { CategoriesView } from "@/modules/catalog/views/categories-view";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { EmptyState } from "@/core/components/common/empty-state";
import { ErrorState } from "@/core/components/common/error-state";
import type { Category } from "@/modules/catalog/types";

export default async function CategoriesPage() {
  const tenant = await requirePermission("categories.view");
  const menu = await getDefaultMenu(tenant.restaurant.id);
  if (menu.error) return <ErrorState description={menu.error} />;
  if (!menu.data) {
    return <EmptyState title="لا توجد قائمة بعد" description="أكمل إعداد المطعم لإنشاء المنيو الافتراضي." />;
  }
  const categories = await getCategory({ menu_id: menu.data.id });
  if (categories.error) return <ErrorState description={categories.error} />;
  const list = (
    Array.isArray(categories.data) ? categories.data : categories.data ? [categories.data] : []
  ) as Category[];

  return (
    <CategoriesView
      menuId={menu.data.id}
      categories={list}
      canEdit={hasPermission(tenant.role, "categories.update")}
      canDelete={hasPermission(tenant.role, "categories.delete")}
    />
  );
}

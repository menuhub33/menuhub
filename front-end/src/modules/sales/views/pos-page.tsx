import Link from "next/link";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { loadCatalog } from "@/modules/sales/actions/sales";
import { PosScreen } from "@/modules/sales/components/pos-screen";

/**
 * Server half of the till (`/pos`) and the waiter screen (`/waiter`):
 * resolves the tenant, checks the role and loads the first page of products.
 */
export async function PosPage({ mode }: { mode: "pos" | "waiter" }) {
  const path = mode === "pos" ? "/pos" : "/waiter";
  const tenant = await requirePermission(mode === "pos" ? "pos.use" : "sales.create_staff", path);

  // The POS is an optional package set per restaurant by the platform admin.
  const posMode = tenant.restaurant.pos_mode ?? "OFF";
  if (posMode === "OFF") {
    return <Unavailable message="نقطة البيع غير مفعّلة لهذا المحل. تواصل مع إدارة المنصة لتفعيلها." />;
  }
  if (mode === "waiter" && posMode !== "CASHIER_WAITER") {
    return <Unavailable message="شاشة النادل غير مفعّلة لهذا المحل (الباقة الحالية: كاشير فقط)." />;
  }

  const catalog = await loadCatalog({});
  if (catalog.error || !catalog.data) {
    return <Unavailable message={catalog.error ?? "حدث خطأ غير متوقع."} />;
  }

  return (
    <PosScreen
      mode={mode}
      restaurantName={tenant.restaurant.name}
      currency={tenant.restaurant.currency}
      userName={tenant.profile.full_name ?? tenant.profile.email}
      canDiscount={hasPermission(tenant.role, "sales.discount")}
      canCollect={hasPermission(tenant.role, "sales.collect")}
      canViewSales={hasPermission(tenant.role, "sales.view")}
      canViewOrders={hasPermission(tenant.role, "orders.view")}
      canManageOrders={hasPermission(tenant.role, "orders.manage")}
      canViewKitchen={hasPermission(tenant.role, "kitchen.view")}
      businessType={tenant.restaurant.business_type}
      dashboardHref={tenant.role === "CASHIER" || tenant.role === "WAITER" ? null : "/dashboard"}
      initialCatalog={catalog.data}
    />
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-semibold text-zinc-900">تعذّر فتح نقطة البيع</p>
      <p className="max-w-md text-sm text-zinc-600">{message}</p>
      <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
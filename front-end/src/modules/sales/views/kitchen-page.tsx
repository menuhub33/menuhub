import Link from "next/link";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { listKitchenOrders } from "@/modules/sales/actions/sales";
import { KitchenScreen } from "@/modules/sales/components/kitchen-screen";

/**
 * Server half of the kitchen display (`/kitchen`): resolves the tenant, checks the role
 * and loads the orders that are waiting.
 */
export async function KitchenPage() {
  const tenant = await requirePermission("kitchen.view", "/kitchen");

  // The kitchen display is part of the POS package set per restaurant by the platform admin.
  if ((tenant.restaurant.pos_mode ?? "OFF") === "OFF") {
    return <Unavailable message="نقطة البيع غير مفعّلة لهذا المحل، لذلك شاشة المطبخ غير متاحة. تواصل مع إدارة المنصة لتفعيلها." />;
  }

  const orders = await listKitchenOrders();
  if (orders.error || !orders.data) {
    return <Unavailable message={orders.error ?? "حدث خطأ غير متوقع."} />;
  }

  // Where "back" leads depends on the account: cashiers and waiters have their own screen,
  // a kitchen account has nothing else to open.
  const backHref =
    tenant.role === "CASHIER"
      ? "/pos"
      : tenant.role === "WAITER"
        ? tenant.restaurant.pos_mode === "CASHIER_WAITER"
          ? "/waiter"
          : null
        : tenant.role === "KITCHEN"
          ? null
          : "/dashboard";

  return (
    <KitchenScreen
      restaurantName={tenant.restaurant.name}
      userName={tenant.profile.full_name ?? tenant.profile.email}
      canManage={hasPermission(tenant.role, "kitchen.manage")}
      backHref={backHref}
      initialOrders={orders.data}
    />
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-lg font-semibold text-zinc-900">تعذّر فتح شاشة المطبخ</p>
      <p className="max-w-md text-sm text-zinc-600">{message}</p>
      <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}

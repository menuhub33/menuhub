import { getMenu } from "@/modules/catalog/actions/menus";
import { getQrCode } from "@/modules/operations/actions/qr-codes";
import { QrView } from "@/modules/operations/views/qr-view";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import type { Menu } from "@/modules/catalog/types";
import type { QrCode } from "@/modules/operations/types";

export default async function QrPage() {
  const tenant = await requirePermission("qr.manage");
  const [menus, codes] = await Promise.all([
    getMenu({ restaurant_id: tenant.restaurant.id }),
    getQrCode({ restaurant_id: tenant.restaurant.id }),
  ]);
  if (menus.error) return <ErrorState description={menus.error} />;
  const menuList = (Array.isArray(menus.data) ? menus.data : menus.data ? [menus.data] : []) as Menu[];
  const codeList = (Array.isArray(codes.data) ? codes.data : codes.data ? [codes.data] : []) as QrCode[];
  return <QrView restaurant={tenant.restaurant} menus={menuList} codes={codeList} />;
}

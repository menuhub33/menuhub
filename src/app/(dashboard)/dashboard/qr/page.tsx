import { getMenu } from "@/actions/menus/getMenu";
import { getQrCode } from "@/actions/qr-codes/getQrCode";
import { QrView } from "@/components/views/qr-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";
import type { Menu, QrCode } from "@/lib/types";

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

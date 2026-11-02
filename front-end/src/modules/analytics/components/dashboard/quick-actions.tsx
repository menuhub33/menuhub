import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { BagIcon, CoffeeIcon, PaletteIcon, PlusIcon, QrIcon, UtensilsIcon } from "@/core/ui/icons";
import { normalizeBusinessType } from "@/modules/tenancy/lib/business-type";
import type { BusinessType } from "@/modules/tenancy/types";

const CATEGORY_ICON = {
  RESTAURANT: UtensilsIcon,
  CAFE: CoffeeIcon,
  SHOP: BagIcon,
} satisfies Record<BusinessType, typeof UtensilsIcon>;

export function QuickActions({ businessType }: { businessType?: string | null }) {
  const CategoryIcon = CATEGORY_ICON[normalizeBusinessType(businessType)];
  const actions = [
    { href: "/dashboard/menu/products/new", label: "إضافة منتج", icon: PlusIcon },
    { href: "/dashboard/menu/categories", label: "إضافة قسم", icon: CategoryIcon },
    { href: "/dashboard/design", label: "تخصيص المنيو", icon: PaletteIcon },
    { href: "/dashboard/qr", label: "QR Code", icon: QrIcon },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 px-3 py-4 text-center text-sm font-medium text-zinc-700 hover:border-teal-200 hover:bg-teal-50/50"
          >
            <action.icon className="size-5 text-teal-700" />
            {action.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

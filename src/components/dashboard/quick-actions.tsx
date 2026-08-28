import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaletteIcon, PlusIcon, QrIcon, UtensilsIcon } from "@/components/ui/icons";

const ACTIONS = [
  { href: "/dashboard/menu/products/new", label: "إضافة منتج", icon: PlusIcon },
  { href: "/dashboard/menu/categories", label: "إضافة قسم", icon: UtensilsIcon },
  { href: "/dashboard/design", label: "تخصيص المنيو", icon: PaletteIcon },
  { href: "/dashboard/qr", label: "QR Code", icon: QrIcon },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إجراءات سريعة</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((action) => (
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

import { formatPrice } from "@/components/lib/format";
import type { MenuWithCategories } from "@/components/lib/types";
import { MenuStatusBadge } from "@/components/menu/menu-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MenuPreview({
  menu,
  className,
}: {
  menu: MenuWithCategories;
  className?: string;
}) {
  const categories = menu.categories ?? [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>معاينة المنيو</CardTitle>
          <MenuStatusBadge status={menu.status} />
        </div>
        <p className="text-sm text-zinc-500">{menu.name}</p>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">لا توجد أقسام لعرضها بعد.</p>
        ) : (
          <ul className="grid gap-4">
            {categories.map((category) => {
              const products = category.products ?? [];
              return (
                <li key={category.id}>
                  <p className="text-sm font-semibold text-zinc-900">{category.name_ar}</p>
                  {category.name_en ? (
                    <p className="text-xs text-zinc-400">{category.name_en}</p>
                  ) : null}
                  {products.length === 0 ? (
                    <p className="mt-1 text-xs text-zinc-400">لا منتجات في هذا القسم</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                      {products.map((product) => (
                        <li
                          key={product.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                        >
                          <span className="truncate text-zinc-800">{product.name_ar}</span>
                          <span className="shrink-0 font-medium text-teal-800">
                            {formatPrice(product.price, product.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

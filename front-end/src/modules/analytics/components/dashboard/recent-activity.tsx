import { formatRelativeTime } from "@/core/lib/format";
import { EmptyState } from "@/core/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import type { ActivityItem } from "@/modules/analytics/types";

const ENTITIES: Record<string, string> = {
  restaurant: "بيانات المطعم",
  menu: "المنيو",
  category: "قسم",
  product: "منتج",
  product_image: "صورة منتج",
  product_option_group: "مجموعة خيارات",
  product_option: "خيار",
  restaurant_theme: "تصميم المنيو",
  social_link: "رابط تواصل",
  business_hour: "ساعات العمل",
  branch: "فرع",
  qr_code: "رمز QR",
  custom_domain: "نطاق مخصص",
  staff: "عضو فريق",
};

const EVENTS: Record<string, string> = {
  created: "تمت إضافة",
  updated: "تم تعديل",
  deleted: "تم حذف",
};

function activityText(item: ActivityItem): string {
  if (item.label) {
    return item.subject ? `${item.label} «${item.subject}»` : item.label;
  }

  const [entity, event] = item.action.split(".");
  const sentence = `${EVENTS[event] ?? "تم تحديث"} ${ENTITIES[entity] ?? ENTITIES[item.entity_type ?? ""] ?? "عنصر"}`;
  return item.subject ? `${sentence} «${item.subject}»` : sentence;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاط الأخير</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="لا يوجد نشاط بعد" description="ستظهر هنا عمليات الإضافة والتعديل والحذف." />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-800">{activityText(item)}</p>
                  <p className="text-xs text-zinc-500">
                    {item.actor_name ? `بواسطة ${item.actor_name}` : "بواسطة النظام"}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-zinc-400">
                  {formatRelativeTime(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

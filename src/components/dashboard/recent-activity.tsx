import { formatRelativeTime } from "@/components/lib/format";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityItem } from "@/components/lib/types";

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>النشاط الأخير</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="لا يوجد نشاط بعد" description="ستظهر هنا عمليات التعديل والنشر." />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-zinc-800">{item.action}</p>
                  <p className="text-xs text-zinc-500">
                    {item.actor_name ?? "النظام"}
                    {item.entity_type ? ` · ${item.entity_type}` : ""}
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

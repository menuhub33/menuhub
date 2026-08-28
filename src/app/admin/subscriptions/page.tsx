import { getAdminSubscriptions } from "@/actions/admin/admin";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDate } from "@/components/lib/format";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminSubscriptionsPage() {
  const result = await getAdminSubscriptions();
  if (result.error) return <ErrorState description={result.error} />;
  return (
    <div className="grid gap-4">
      <PageHeader title="الاشتراكات" />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3">المطعم</th>
              <th className="p-3">الخطة</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">البداية</th>
              <th className="p-3">الانتهاء</th>
            </tr>
          </thead>
          <tbody>
            {(result.data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-zinc-100">
                <td className="p-3">{item.restaurant_name ?? item.restaurant_id}</td>
                <td className="p-3">{item.plan_name ?? "—"}</td>
                <td className="p-3"><StatusBadge kind="subscription" value={item.status} /></td>
                <td className="p-3">{formatDate(item.starts_at)}</td>
                <td className="p-3">{item.ends_at ? formatDate(item.ends_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

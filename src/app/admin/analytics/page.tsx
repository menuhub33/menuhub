import { getAdminAnalytics } from "@/actions/admin/admin";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminAnalyticsPage() {
  const stats = await getAdminAnalytics();
  if (stats.error || !stats.data) return <ErrorState description={stats.error ?? "تعذر التحميل"} />;
  return (
    <div className="grid gap-6">
      <PageHeader title="إحصائيات المنصة" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المطاعم" value={stats.data.restaurants} />
        <StatCard label="المستخدمون" value={stats.data.users} />
        <StatCard label="منيو منشورة" value={stats.data.published} />
        <StatCard label="مشاهدات" value={stats.data.views} />
      </div>
    </div>
  );
}

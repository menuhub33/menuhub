import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MenuStatusCard } from "@/components/dashboard/menu-status-card";
import { MenuLinkCard } from "@/components/dashboard/menu-link-card";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import type { ActivityItem, AnalyticsSummary } from "@/components/lib/types";
import type { Menu, Restaurant } from "@/lib/types";

export function DashboardOverview({
  restaurant,
  menu,
  publicUrl,
  stats,
  activity,
  loading,
  error,
  onRetry,
  onCreateRestaurant,
  onPublish,
  onUnpublish,
  canPublish,
}: {
  restaurant?: Restaurant | null;
  menu?: Menu | null;
  publicUrl?: string;
  stats?: AnalyticsSummary;
  activity?: ActivityItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCreateRestaurant?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  canPublish?: boolean;
}) {
  if (loading) return <LoadingState label="جارٍ تحميل لوحة التحكم..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (!restaurant) {
    return <DashboardEmptyState onCreate={onCreateRestaurant} />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="مشاهدات المنيو" value={stats?.menuViews ?? 0} />
        <StatCard label="مشاهدات المنتجات" value={stats?.productViews ?? 0} />
        <StatCard label="مسح QR" value={stats?.qrScans ?? 0} />
        <StatCard label="المشاركات" value={stats?.shares ?? 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <QuickActions />
          <RecentActivity items={activity ?? []} />
        </div>
        <div className="grid gap-4">
          <MenuStatusCard
            restaurant={restaurant}
            menu={menu}
            canPublish={canPublish}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />
          {publicUrl ? <MenuLinkCard url={publicUrl} /> : null}
        </div>
      </div>
    </div>
  );
}

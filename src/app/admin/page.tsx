import Link from "next/link";
import { getAdminAnalytics, getAdminRestaurants } from "@/actions/admin/admin";
import { ErrorState } from "@/components/common/error-state";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/components/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { BuildingIcon, EyeIcon, UsersIcon, UtensilsIcon } from "@/components/ui/icons";

export default async function AdminHomePage() {
  const [stats, restaurants] = await Promise.all([
    getAdminAnalytics(),
    getAdminRestaurants(),
  ]);

  if (stats.error || !stats.data) {
    return <ErrorState description={stats.error ?? "تعذر التحميل"} />;
  }

  const recent = (restaurants.data ?? []).slice(0, 6);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="لوحة الإدارة"
        description="إدارة المطاعم والمستخدمين والنطاقات المحجوزة من مكان واحد."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/restaurants" className="block rounded-2xl transition hover:-translate-y-0.5">
          <StatCard label="المطاعم" value={stats.data.restaurants} hint="عرض وإدارة" icon={<BuildingIcon />} />
        </Link>
        <Link href="/admin/users" className="block rounded-2xl transition hover:-translate-y-0.5">
          <StatCard label="المستخدمون" value={stats.data.users} hint="عرض وإدارة" icon={<UsersIcon />} />
        </Link>
        <Link href="/admin/restaurants" className="block rounded-2xl transition hover:-translate-y-0.5">
          <StatCard label="منيو منشورة" value={stats.data.published} hint="من المطاعم" icon={<UtensilsIcon />} />
        </Link>
        <StatCard label="مشاهدات المنيو" value={stats.data.views} hint="إجمالي الزيارات" icon={<EyeIcon />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <h2 className="font-semibold text-zinc-900">أحدث المطاعم</h2>
          <Link href="/admin/restaurants" className="text-sm font-medium text-teal-700">
            إدارة المطاعم
          </Link>
        </div>
        {restaurants.error ? (
          <p className="p-4 text-sm text-red-600">{restaurants.error}</p>
        ) : recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">لا توجد مطاعم بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="p-3 text-start">المطعم</th>
                  <th className="p-3 text-start">المالك</th>
                  <th className="p-3 text-start">الحالة</th>
                  <th className="p-3 text-start">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((restaurant) => (
                  <tr key={restaurant.id} className="border-t border-zinc-100">
                    <td className="p-3">
                      <p className="font-medium text-zinc-900">{restaurant.name}</p>
                      <p className="text-xs text-zinc-400" dir="ltr">
                        {restaurant.slug}
                      </p>
                    </td>
                    <td className="p-3">{restaurant.owner_name ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge kind="restaurant" value={restaurant.status} />
                    </td>
                    <td className="p-3">{formatDate(restaurant.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

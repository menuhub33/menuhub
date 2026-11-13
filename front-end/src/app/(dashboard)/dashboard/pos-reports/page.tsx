import Link from "next/link";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import { loadSalesReports } from "@/modules/sales/actions/reports";
import { PosReportsView } from "@/modules/sales/views/pos-reports-view";

export default async function PosReportsPage() {
  const tenant = await requirePermission("reports.sales", "/dashboard/pos-reports");

  if ((tenant.restaurant.pos_mode ?? "OFF") === "OFF") {
    return (
      <div className="grid justify-items-center gap-3 p-10 text-center">
        <p className="text-lg font-semibold text-zinc-900">نقطة البيع غير مفعّلة لهذا المحل</p>
        <p className="max-w-md text-sm text-zinc-600">تظهر التقارير بعد أن يفعّل مدير المنصة حزمة نقطة البيع.</p>
        <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    );
  }

  const reports = await loadSalesReports({ period: "today" });
  if (reports.error || !reports.data) return <ErrorState description={reports.error ?? undefined} />;

  return <PosReportsView initial={reports.data} />;
}

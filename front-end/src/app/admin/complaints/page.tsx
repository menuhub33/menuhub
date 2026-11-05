import { forbidden } from "next/navigation";
import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";
import { listAdminOrderComplaints } from "@/modules/orders/actions/orders";
import { ComplaintsView } from "@/modules/orders/views/complaints-view";

export default async function AdminComplaintsPage() {
  const session = await requireConsole("/admin/complaints");
  if (isPlatformAdmin(session.profile.platform_role) || !session.profile.mall) {
    forbidden();
  }

  const rows = await listAdminOrderComplaints();
  if (rows.error || !rows.data) {
    return <ErrorState description={rows.error ?? "تعذر تحميل الشكاوى"} />;
  }

  return (
    <ComplaintsView
      rows={rows.data}
      showRestaurant
      description={`شكاوى الزبائن على محلات ${session.profile.mall.name}.`}
      breadcrumbs={[{ label: "الرئيسية", href: "/admin" }, { label: "الشكاوي" }]}
    />
  );
}

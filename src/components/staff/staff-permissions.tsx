import { cn } from "@/components/lib/cn";
import { RESTAURANT_ROLE_LABELS } from "@/components/lib/labels";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import type { RestaurantRole } from "@/lib/types";

const ROLES: RestaurantRole[] = ["OWNER", "MANAGER", "EDITOR"];

const PERMISSIONS: Array<{
  key: string;
  label: string;
  hint: string;
  granted: Record<RestaurantRole, boolean>;
}> = [
  {
    key: "menu_edit",
    label: "تعديل المنيو",
    hint: "المنتجات والأقسام ومحتوى القائمة",
    granted: { OWNER: true, MANAGER: true, EDITOR: true },
  },
  {
    key: "publish",
    label: "نشر المنيو",
    hint: "نشر القائمة أو إلغاء نشرها للزوار",
    granted: { OWNER: true, MANAGER: true, EDITOR: false },
  },
  {
    key: "billing",
    label: "الفوترة والاشتراك",
    hint: "الخطط والمدفوعات والفواتير",
    granted: { OWNER: true, MANAGER: false, EDITOR: false },
  },
  {
    key: "staff",
    label: "إدارة الموظفين",
    hint: "دعوة الأعضاء وتغيير أدوارهم وإزالتهم",
    granted: { OWNER: true, MANAGER: false, EDITOR: false },
  },
  {
    key: "delete_restaurant",
    label: "حذف المطعم",
    hint: "حذف المطعم وكل بياناته بشكل نهائي",
    granted: { OWNER: true, MANAGER: false, EDITOR: false },
  },
];

export function StaffPermissions({
  currentRole,
  canManageAll,
  className,
}: {
  currentRole?: RestaurantRole;
  canManageAll?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>صلاحيات الأدوار</CardTitle>
        <CardDescription>
          مرجع توضيحي لما يستطيعه كل دور. لا يمكن تعديل الصلاحيات من هنا.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {canManageAll ? (
          <Alert variant="info" title="صلاحية مشرف المنصة">
            بصفتك مشرف منصة يمكنك إدارة جميع الأعضاء بما في ذلك المالك.
          </Alert>
        ) : null}
        <div className="overflow-x-auto rounded-2xl border border-zinc-200">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-semibold">الصلاحية</th>
                {ROLES.map((role) => {
                  const isCurrent = role === currentRole;
                  return (
                    <th
                      key={role}
                      className={cn(
                        "px-4 py-3 text-center text-xs font-semibold",
                        isCurrent && "bg-teal-50 text-teal-800"
                      )}
                    >
                      {RESTAURANT_ROLE_LABELS[role]}
                      {isCurrent ? (
                        <span className="mt-1 block text-[0.65rem] font-medium text-teal-700">دورك الحالي</span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {PERMISSIONS.map((permission) => (
                <tr key={permission.key}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{permission.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{permission.hint}</p>
                  </td>
                  {ROLES.map((role) => {
                    const allowed = permission.granted[role];
                    const isCurrent = role === currentRole;
                    return (
                      <td
                        key={role}
                        className={cn("px-4 py-3 text-center", isCurrent && "bg-teal-50/70")}
                      >
                        <span
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-xl",
                            allowed ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                          )}
                          aria-label={allowed ? "مسموح" : "غير مسموح"}
                        >
                          {allowed ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

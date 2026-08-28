"use client";

import { useRouter } from "next/navigation";
import { adminSetUserActive } from "@/actions/admin/admin";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/lib/format";
import { PLATFORM_ROLE_LABELS } from "@/components/lib/labels";
import type { Profile } from "@/lib/types";

export function AdminUsersView({ users }: { users: Profile[] }) {
  const router = useRouter();
  return (
    <div className="grid gap-4">
      <PageHeader title="المستخدمون" />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">الدور</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">تاريخ الإنشاء</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-100">
                <td className="p-3">
                  {user.full_name ?? "بدون اسم"}
                  <p className="text-xs text-zinc-400">{user.phone ?? ""}</p>
                </td>
                <td className="p-3">{PLATFORM_ROLE_LABELS[user.platform_role]}</td>
                <td className="p-3">
                  <Badge variant={user.is_active ? "success" : "danger"}>
                    {user.is_active ? "نشط" : "معلّق"}
                  </Badge>
                </td>
                <td className="p-3">{formatDate(user.created_at)}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminSetUserActive(user.id, !user.is_active);
                      router.refresh();
                    }}
                  >
                    {user.is_active ? "تعليق" : "تفعيل"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

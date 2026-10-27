"use client";

import { useRouter } from "next/navigation";
import { inviteStaff, removeStaff } from "@/modules/tenancy/actions/staff";
import { updateRestaurantUser } from "@/modules/tenancy/actions/staff";
import { StaffList } from "@/modules/tenancy/components/staff/staff-list";
import { PageHeader } from "@/core/components/layout/page-header";
import { useToast } from "@/core/ui/toast";
import type { StaffMember } from "@/modules/tenancy/types";
import type { StaffFormValues } from "@/modules/tenancy/components/staff/staff-form";

export function StaffView({
  restaurantId,
  members,
  currentUserId,
}: {
  restaurantId: string;
  members: StaffMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الموظفون"
        description="دعوة المديرين والمحررين وإدارة أدوارهم."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الموظفون" }]}
      />
      <StaffList
        members={members}
        canEdit
        canRemove
        canInvite
        currentUserId={currentUserId}
        onInvite={async (values: StaffFormValues) => {
          const result = await inviteStaff({
            restaurant_id: restaurantId,
            email: values.email,
            role: values.role === "OWNER" ? "EDITOR" : values.role,
            full_name: values.full_name,
            password: values.password,
          });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تمت إضافة الموظف", variant: "success" });
            router.refresh();
          }
        }}
        onEdit={async (member, values) => {
          const result = await updateRestaurantUser({
            id: member.id,
            restaurant_id: restaurantId,
            role: values.role === "OWNER" ? member.role : values.role,
          });
          if (result.error) toast({ title: result.error, variant: "error" });
          else router.refresh();
        }}
        onRemove={async (member) => {
          const result = await removeStaff({ id: member.id, restaurant_id: restaurantId });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم إزالة الموظف", variant: "success" });
            router.refresh();
          }
        }}
      />
    </div>
  );
}

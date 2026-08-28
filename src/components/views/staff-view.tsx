"use client";

import { useRouter } from "next/navigation";
import { inviteStaff, removeStaff } from "@/actions/staff/staff";
import { updateRestaurantUser } from "@/actions/restaurant-users/updateRestaurantUser";
import { StaffList } from "@/components/staff/staff-list";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import type { StaffMember } from "@/components/lib/types";
import type { StaffFormValues } from "@/components/staff/staff-form";

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
          });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم إرسال الدعوة", variant: "success" });
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

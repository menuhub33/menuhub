"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { SearchInput } from "@/components/common/search-input";
import { InviteStaffDialog } from "@/components/staff/invite-staff-dialog";
import { RemoveStaffDialog } from "@/components/staff/remove-staff-dialog";
import { StaffForm, type StaffFormValues } from "@/components/staff/staff-form";
import { StaffMemberCard, StaffTable } from "@/components/staff/staff-table";
import { RESTAURANT_ROLE_LABELS } from "@/components/lib/labels";
import type { StaffMember } from "@/components/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusIcon, UsersIcon } from "@/components/ui/icons";

function matchesQuery(member: StaffMember, query: string): boolean {
  if (!query) return true;
  const haystack = [
    member.profile?.full_name ?? "",
    member.profile?.phone ?? "",
    RESTAURANT_ROLE_LABELS[member.role],
    member.user_id,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function StaffList({
  members,
  loading,
  error,
  onRetry,
  canEdit,
  canRemove,
  canInvite,
  canAssignOwner,
  canManageAll,
  currentUserId,
  inviteLoading,
  inviteError,
  editLoading,
  editError,
  removeLoading,
  onInvite,
  onEdit,
  onRemove,
}: {
  members: StaffMember[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  canEdit?: boolean;
  canRemove?: boolean;
  canInvite?: boolean;
  canAssignOwner?: boolean;
  canManageAll?: boolean;
  currentUserId?: string;
  inviteLoading?: boolean;
  inviteError?: string | null;
  editLoading?: boolean;
  editError?: string | null;
  removeLoading?: boolean;
  onInvite?: (values: StaffFormValues) => void | Promise<void>;
  onEdit?: (member: StaffMember, values: StaffFormValues) => void | Promise<void>;
  onRemove?: (member: StaffMember) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [removing, setRemoving] = useState<StaffMember | null>(null);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () => members.filter((member) => matchesQuery(member, normalized)),
    [members, normalized]
  );

  const ownerCount = members.filter((member) => member.role === "OWNER" && member.is_active).length;

  if (loading) return <LoadingState label="جارٍ تحميل الموظفين..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="بحث بالاسم أو الدور..."
          className="sm:max-w-sm sm:flex-1"
        />
        {canInvite ? (
          <Button onClick={() => setInviteOpen(true)} className="sm:ms-auto">
            <PlusIcon className="size-4" />
            دعوة موظف
          </Button>
        ) : null}
      </div>
      {members.length === 0 ? (
        <EmptyState
          title="لا يوجد أعضاء"
          description="ادعُ موظفاً عبر البريد الإلكتروني ليساعد في إدارة المنيو."
          icon={<UsersIcon className="size-7" />}
          action={
            canInvite ? (
              <Button onClick={() => setInviteOpen(true)}>
                <PlusIcon className="size-4" />
                دعوة موظف
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج" description="جرّب كلمات بحث مختلفة." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((member) => (
              <StaffMemberCard
                key={member.id}
                member={member}
                canEdit={canEdit}
                canRemove={canRemove}
                currentUserId={currentUserId}
                onEdit={setEditing}
                onRemove={setRemoving}
              />
            ))}
          </div>
          <div className="hidden lg:block">
            <StaffTable
              members={filtered}
              canEdit={canEdit}
              canRemove={canRemove}
              currentUserId={currentUserId}
              onEdit={setEditing}
              onRemove={setRemoving}
            />
          </div>
        </>
      )}
      <InviteStaffDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        loading={inviteLoading}
        error={inviteError}
        canAssignOwner={canAssignOwner}
        canManageAll={canManageAll}
        onSubmit={async (values) => {
          await onInvite?.(values);
          setInviteOpen(false);
        }}
      />
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل الموظف"
        description="تغيير دور العضو. المعرّف المعتمد في المخطط هو user_id."
      >
        {editing ? (
          <StaffForm
            key={editing.id}
            member={editing}
            loading={editLoading}
            error={editError}
            canAssignOwner={canAssignOwner}
            canManageAll={canManageAll}
            onSubmit={async (values) => {
              await onEdit?.(editing, values);
              setEditing(null);
            }}
          />
        ) : null}
      </Dialog>
      <RemoveStaffDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        member={removing}
        loading={removeLoading}
        canManageAll={canManageAll}
        isLastOwner={removing?.role === "OWNER" && ownerCount <= 1}
        onConfirm={async () => {
          if (removing) await onRemove?.(removing);
        }}
      />
    </div>
  );
}

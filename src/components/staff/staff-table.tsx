import { cn } from "@/components/lib/cn";
import { formatDate } from "@/components/lib/format";
import { PLATFORM_ROLE_LABELS, RESTAURANT_ROLE_LABELS } from "@/components/lib/labels";
import type { StaffMember } from "@/components/lib/types";
import { StaffStatusBadge } from "@/components/staff/staff-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function displayName(member: StaffMember): string {
  return member.profile?.full_name?.trim() || "عضو بدون اسم";
}

function canRemoveMember(
  member: StaffMember,
  options: { canRemove?: boolean; currentUserId?: string }
): boolean {
  if (!options.canRemove) return false;
  if (options.currentUserId && member.user_id === options.currentUserId) return false;
  return true;
}

export function StaffMemberCard({
  member,
  canEdit,
  canRemove,
  currentUserId,
  onEdit,
  onRemove,
}: {
  member: StaffMember;
  canEdit?: boolean;
  canRemove?: boolean;
  currentUserId?: string;
  onEdit?: (member: StaffMember) => void;
  onRemove?: (member: StaffMember) => void;
}) {
  const name = displayName(member);
  const platformRole = member.profile?.platform_role;
  const showPlatform =
    platformRole === "ADMIN" || platformRole === "SUPER_ADMIN";
  const allowRemove = canRemoveMember(member, { canRemove, currentUserId });

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar src={member.profile?.avatar_url} alt={name} fallback={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900">{name}</p>
          {member.profile?.phone ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500" dir="ltr">
              {member.profile.phone}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="teal">{RESTAURANT_ROLE_LABELS[member.role]}</Badge>
            <StaffStatusBadge active={member.is_active} />
            {showPlatform && platformRole ? (
              <Badge variant="info">{PLATFORM_ROLE_LABELS[platformRole]}</Badge>
            ) : null}
          </div>
        </div>
        {canEdit || allowRemove ? (
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`تعديل ${name}`}
                onClick={() => onEdit?.(member)}
              >
                <PencilIcon className="size-4" />
              </Button>
            ) : null}
            {allowRemove ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:bg-red-50"
                aria-label={`إزالة ${name}`}
                onClick={() => onRemove?.(member)}
              >
                <TrashIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function StaffTable({
  members,
  canEdit,
  canRemove,
  currentUserId,
  onEdit,
  onRemove,
  className,
}: {
  members: StaffMember[];
  canEdit?: boolean;
  canRemove?: boolean;
  currentUserId?: string;
  onEdit?: (member: StaffMember) => void;
  onRemove?: (member: StaffMember) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-3 md:hidden">
        {members.map((member) => (
          <StaffMemberCard
            key={member.id}
            member={member}
            canEdit={canEdit}
            canRemove={canRemove}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإضافة</TableHead>
              {canEdit || canRemove ? <TableHead>إجراءات</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const name = displayName(member);
              const platformRole = member.profile?.platform_role;
              const showPlatform =
                platformRole === "ADMIN" || platformRole === "SUPER_ADMIN";
              const allowRemove = canRemoveMember(member, {
                canRemove,
                currentUserId,
              });
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        src={member.profile?.avatar_url}
                        alt={name}
                        fallback={name}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{name}</p>
                        {member.profile?.phone ? (
                          <p className="truncate text-xs text-zinc-500" dir="ltr">
                            {member.profile.phone}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="teal">{RESTAURANT_ROLE_LABELS[member.role]}</Badge>
                      {showPlatform && platformRole ? (
                        <Badge variant="info">{PLATFORM_ROLE_LABELS[platformRole]}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StaffStatusBadge active={member.is_active} />
                  </TableCell>
                  <TableCell className="text-zinc-500">{formatDate(member.created_at)}</TableCell>
                  {canEdit || canRemove ? (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`تعديل ${name}`}
                            onClick={() => onEdit?.(member)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                        ) : null}
                        {allowRemove ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            aria-label={`إزالة ${name}`}
                            onClick={() => onRemove?.(member)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

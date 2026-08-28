"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { StaffRoleSelect } from "@/components/staff/staff-role-select";
import type { StaffMember } from "@/components/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RestaurantRole } from "@/lib/types";

export type StaffFormValues = {
  email: string;
  role: RestaurantRole;
  user_id?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StaffForm({
  member,
  defaultEmail = "",
  loading,
  error,
  canAssignOwner,
  canManageAll,
  submitLabel,
  onSubmit,
}: {
  member?: StaffMember | null;
  defaultEmail?: string;
  loading?: boolean;
  error?: string | null;
  canAssignOwner?: boolean;
  canManageAll?: boolean;
  submitLabel?: string;
  onSubmit: (values: StaffFormValues) => void | Promise<void>;
}) {
  const isEdit = Boolean(member);
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState<RestaurantRole>(member?.role ?? "EDITOR");
  const [localError, setLocalError] = useState<string | null>(null);

  const displayName = member?.profile?.full_name?.trim() || null;

  function handleSubmit() {
    const trimmed = email.trim();
    if (!isEdit && !trimmed) {
      setLocalError("أدخل البريد الإلكتروني لدعوة الموظف.");
      return;
    }
    if (trimmed && !EMAIL_PATTERN.test(trimmed)) {
      setLocalError("صيغة البريد الإلكتروني غير صحيحة.");
      return;
    }
    setLocalError(null);
    void onSubmit({
      email: trimmed,
      role,
      user_id: member?.user_id,
    });
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      {localError ? <Alert variant="error">{localError}</Alert> : null}
      {isEdit ? (
        <div className="rounded-2xl bg-zinc-50 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">{displayName ?? "عضو في الفريق"}</p>
          {member?.profile?.phone ? (
            <p className="mt-1 text-xs text-zinc-500" dir="ltr">
              {member.profile.phone}
            </p>
          ) : null}
        </div>
      ) : null}
      <FormField
        label="البريد الإلكتروني"
        htmlFor="staff-email"
        required={!isEdit}
        hint={
          isEdit
            ? "المخطط يستخدم معرّف المستخدم وليس البريد. البريد للدعوة والتعرف فقط."
            : "سيُستخدم البريد لدعوة الموظف ثم ربطه بـ user_id عند قبول الدعوة."
        }
      >
        <Input
          id="staff-email"
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          disabled={loading || isEdit}
          required={!isEdit}
          placeholder="email@example.com"
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField label="الدور" htmlFor="staff-role" required>
        <StaffRoleSelect
          id="staff-role"
          value={role}
          canAssignOwner={canAssignOwner}
          canManageAll={canManageAll}
          disabled={loading}
          onChange={setRole}
        />
      </FormField>
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          {submitLabel ?? (isEdit ? "حفظ التغييرات" : "إرسال الدعوة")}
        </Button>
      </div>
    </form>
  );
}

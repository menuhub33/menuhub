"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateUser,
  adminDeleteUser,
  adminSetUserActive,
  adminUpdateUser,
} from "@/actions/admin/admin";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/common/search-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/components/lib/format";
import { PLATFORM_ROLE_LABELS } from "@/components/lib/labels";
import type { PlatformRole, Profile } from "@/lib/types";

const ROLE_OPTIONS = (Object.entries(PLATFORM_ROLE_LABELS) as [PlatformRole, string][]).map(
  ([value, label]) => ({ value, label })
);

export function AdminUsersView({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<PlatformRole>("USER");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<PlatformRole>("USER");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) =>
      `${user.full_name ?? ""} ${user.phone ?? ""} ${user.platform_role}`.toLowerCase().includes(needle)
    );
  }, [users, query]);

  const canCreate = Boolean(fullName.trim() && email.trim() && password.length >= 8);

  function openEdit(user: Profile) {
    setEditing(user);
    setEditName(user.full_name ?? "");
    setEditPhone(user.phone ?? "");
    setEditRole(user.platform_role);
  }

  async function createUser() {
    setSaving(true);
    const result = await adminCreateUser({
      fullName,
      email,
      password,
      phone,
      platformRole: role,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم إنشاء المستخدم", variant: "success" });
    setCreating(false);
    setFullName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("USER");
    router.refresh();
  }

  async function saveUser() {
    if (!editing) return;
    setSaving(true);
    const result = await adminUpdateUser({
      id: editing.id,
      fullName: editName,
      phone: editPhone,
      platformRole: editRole,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ المستخدم", variant: "success" });
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="المستخدمون"
        description="إنشاء الحسابات وتعديل أدوارها أو تعليقها."
        actions={<Button onClick={() => setCreating(true)}>مستخدم جديد</Button>}
      />
      <SearchInput value={query} onChange={setQuery} />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">الاسم</th>
              <th className="p-3 text-start">الدور</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">تاريخ الإنشاء</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  لا يوجد مستخدمون مطابقون.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
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
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={user.id === currentUserId && user.is_active}
                        onClick={async () => {
                          const result = await adminSetUserActive(user.id, !user.is_active);
                          if (result.error) toast({ title: result.error, variant: "error" });
                          else router.refresh();
                        }}
                      >
                        {user.is_active ? "تعليق" : "تفعيل"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={user.id === currentUserId}
                        onClick={() => setDeleting(user)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="مستخدم جديد"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!canCreate} onClick={() => void createUser()}>
              إنشاء
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="الاسم" htmlFor="user-name" required>
            <Input id="user-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </FormField>
          <FormField label="البريد الإلكتروني" htmlFor="user-email" required>
            <Input
              id="user-email"
              type="email"
              dir="ltr"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label="كلمة المرور" htmlFor="user-password" required hint="8 أحرف على الأقل">
            <PasswordInput id="user-password" autoComplete="new-password" value={password} onChange={setPassword} />
          </FormField>
          <FormField label="الهاتف" htmlFor="user-phone">
            <Input id="user-phone" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <FormField label="الدور" htmlFor="user-role">
            <Select id="user-role" value={role} onChange={(value) => setRole(value as PlatformRole)} options={ROLE_OPTIONS} />
          </FormField>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل المستخدم"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!editName.trim()} onClick={() => void saveUser()}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="الاسم" htmlFor="edit-user-name" required>
            <Input id="edit-user-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
          </FormField>
          <FormField label="الهاتف" htmlFor="edit-user-phone">
            <Input id="edit-user-phone" dir="ltr" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
          </FormField>
          <FormField label="الدور" htmlFor="edit-user-role">
            <Select
              id="edit-user-role"
              value={editRole}
              onChange={(value) => setEditRole(value as PlatformRole)}
              options={ROLE_OPTIONS}
            />
          </FormField>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف المستخدم؟"
        description="سيتم حذف الحساب ولن يتمكن من تسجيل الدخول."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await adminDeleteUser(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف المستخدم", variant: "success" });
            router.refresh();
          }
        }}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/core/components/layout/page-header";
import { Button } from "@/core/ui/button";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
import { Dialog } from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Select } from "@/core/ui/select";
import { Textarea } from "@/core/ui/textarea";
import { useToast } from "@/core/ui/toast";
import { FormField } from "@/core/components/forms/form-field";
import { PasswordInput } from "@/modules/auth/components/password-input";
import { adminCreateMall, adminDeleteMall, adminUpdateMall } from "@/modules/malls/actions/malls";
import type { Mall, MallStatus } from "@/modules/malls/types";

const STATUS_OPTIONS = [
  { value: "UNPUBLISHED", label: "غير منشور" },
  { value: "PUBLISHED", label: "منشور" },
];

export function AdminMallsView({ malls }: { malls: Mall[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Mall | null>(null);
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [editing, setEditing] = useState<Mall | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editStatus, setEditStatus] = useState<MallStatus>("UNPUBLISHED");

  const rows = useMemo(
    () => [...malls].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [malls]
  );
  const canCreate = Boolean(name.trim() && managerName.trim() && managerEmail.trim() && managerPassword.length >= 8);

  function openEdit(mall: Mall) {
    setEditing(mall);
    setEditName(mall.name);
    setEditSlug(mall.slug);
    setEditDescription(mall.description ?? "");
    setEditAddress(mall.address ?? "");
    setEditPhone(mall.phone ?? "");
    setEditCover(mall.cover_image_url ?? "");
    setEditStatus(mall.status);
  }

  async function createMall() {
    setSaving(true);
    const result = await adminCreateMall({
      name,
      manager: { fullName: managerName, email: managerEmail, password: managerPassword },
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم إنشاء المول ومديره", variant: "success" });
    setCreating(false);
    setName("");
    setManagerName("");
    setManagerEmail("");
    setManagerPassword("");
    reloadPage();
  }

  async function saveMall() {
    if (!editing) return;
    setSaving(true);
    const result = await adminUpdateMall({
      id: editing.id,
      name: editName,
      slug: editSlug,
      description: editDescription,
      address: editAddress,
      phone: editPhone,
      cover_image_url: editCover,
      status: editStatus,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ المول", variant: "success" });
    setEditing(null);
    reloadPage();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="المراكز التجارية"
        description="كل مول يعرّف دليله، ومديره يدير محلات ذلك المول فقط."
        actions={<Button onClick={() => setCreating(true)}>إنشاء مول</Button>}
      />
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">المول</th>
              <th className="p-3 text-start">المدير</th>
              <th className="p-3 text-start">الدليل</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-zinc-500">
                  لا توجد مراكز بعد.
                </td>
              </tr>
            ) : (
              rows.map((mall) => (
                <tr key={mall.id} className="border-t border-zinc-100">
                  <td className="p-3">
                    <p className="font-medium">{mall.name}</p>
                    <p className="text-xs text-zinc-400" dir="ltr">
                      {mall.slug}
                    </p>
                  </td>
                  <td className="p-3">{mall.manager?.full_name ?? "—"}</td>
                  <td className="p-3">{mall.status === "PUBLISHED" ? "منشور" : "غير منشور"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/c/${mall.slug}`, "_blank")}>
                        عرض
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/malls/${mall.id}/design`)}>
                        التصميم
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(mall)}>
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleting(mall)}>
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
        title="إنشاء مول"
        description="يُنشأ حساب مدير المول مع المول. المدير يرى محلات مولّه فقط."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!canCreate} onClick={() => void createMall()}>
              إنشاء
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="اسم المول" htmlFor="mall-name" required>
            <Input id="mall-name" value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField label="اسم المدير" htmlFor="mall-manager-name" required>
            <Input id="mall-manager-name" value={managerName} onChange={(event) => setManagerName(event.target.value)} />
          </FormField>
          <FormField label="بريد المدير" htmlFor="mall-manager-email" required>
            <Input
              id="mall-manager-email"
              type="email"
              dir="ltr"
              value={managerEmail}
              onChange={(event) => setManagerEmail(event.target.value)}
            />
          </FormField>
          <FormField label="كلمة مرور المدير" htmlFor="mall-manager-password" required hint="8 أحرف على الأقل">
            <PasswordInput
              id="mall-manager-password"
              value={managerPassword}
              autoComplete="new-password"
              onChange={setManagerPassword}
            />
          </FormField>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل المول"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void saveMall()}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="الاسم" htmlFor="edit-mall-name" required>
            <Input id="edit-mall-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
          </FormField>
          <FormField label="الرابط" htmlFor="edit-mall-slug" required>
            <Input id="edit-mall-slug" dir="ltr" value={editSlug} onChange={(event) => setEditSlug(event.target.value)} />
          </FormField>
          <FormField label="الوصف" htmlFor="edit-mall-description">
            <Textarea id="edit-mall-description" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
          </FormField>
          <FormField label="العنوان" htmlFor="edit-mall-address">
            <Input id="edit-mall-address" value={editAddress} onChange={(event) => setEditAddress(event.target.value)} />
          </FormField>
          <FormField label="الهاتف" htmlFor="edit-mall-phone">
            <Input id="edit-mall-phone" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
          </FormField>
          <FormField label="رابط صورة الغلاف" htmlFor="edit-mall-cover">
            <Input id="edit-mall-cover" dir="ltr" value={editCover} onChange={(event) => setEditCover(event.target.value)} />
          </FormField>
          <FormField label="نشر الدليل" htmlFor="edit-mall-status">
            <Select
              id="edit-mall-status"
              value={editStatus}
              onChange={(value) => setEditStatus(value as MallStatus)}
              options={STATUS_OPTIONS}
            />
          </FormField>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف المول؟"
        description="تُفك المحلات عن المول وتصبح منيوهات خاصة. لا يُحذف المنيو نفسه."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await adminDeleteMall(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف المول", variant: "success" });
            reloadPage();
          }
        }}
      />
    </div>
  );
}

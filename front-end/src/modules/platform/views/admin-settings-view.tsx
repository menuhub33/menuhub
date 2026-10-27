"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReservedSubdomain } from "@/modules/platform/actions/reserved-subdomains";
import { deleteReservedSubdomain } from "@/modules/platform/actions/reserved-subdomains";
import { updateReservedSubdomain } from "@/modules/platform/actions/reserved-subdomains";
import { PageHeader } from "@/core/components/layout/page-header";
import { Button } from "@/core/ui/button";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
import { Dialog } from "@/core/ui/dialog";
import { FormField } from "@/core/components/forms/form-field";
import { Input } from "@/core/ui/input";
import { useToast } from "@/core/ui/toast";
import type { ReservedSubdomain } from "@/modules/tenancy/types";

export function AdminSettingsView({ items }: { items: ReservedSubdomain[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ReservedSubdomain | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [deleting, setDeleting] = useState<ReservedSubdomain | null>(null);

  async function createSlug(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await createReservedSubdomain(slug);
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    setSlug("");
    toast({ title: "تم حجز النطاق", variant: "success" });
    router.refresh();
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const result = await updateReservedSubdomain(editing.id, editSlug);
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    setEditing(null);
    toast({ title: "تم تحديث النطاق", variant: "success" });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="إعدادات المنصة"
        description="النطاقات الفرعية المحجوزة لا يمكن استخدامها كرابط لمطعم."
      />
      <form onSubmit={createSlug} className="flex flex-col gap-2 sm:flex-row">
        <Input
          dir="ltr"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="admin"
          aria-label="نطاق فرعي"
        />
        <Button type="submit" loading={saving} disabled={!slug.trim()}>
          حجز نطاق
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">النطاق</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-8 text-center text-zinc-500">
                  لا توجد نطاقات محجوزة.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-zinc-100">
                  <td className="p-3 font-medium" dir="ltr">
                    {item.slug}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(item);
                          setEditSlug(item.slug);
                        }}
                      >
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleting(item)}>
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
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل النطاق"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!editSlug.trim()} onClick={() => void saveEdit()}>
              حفظ
            </Button>
          </>
        }
      >
        <FormField label="النطاق الفرعي" htmlFor="reserved-slug" required>
          <Input
            id="reserved-slug"
            dir="ltr"
            value={editSlug}
            onChange={(event) => setEditSlug(event.target.value)}
          />
        </FormField>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف النطاق المحجوز؟"
        description={deleting ? `سيتم إلغاء حجز ${deleting.slug}.` : undefined}
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteReservedSubdomain(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف النطاق", variant: "success" });
            router.refresh();
          }
        }}
      />
    </div>
  );
}

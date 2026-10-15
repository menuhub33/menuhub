"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateRestaurant,
  adminDeleteRestaurant,
  adminSetRestaurantStatus,
  adminUpdateRestaurant,
} from "@/actions/admin/admin";
import { seedDemoCarsMenu, seedDemoMenu } from "@/actions/admin/seedDemoMenu";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/common/search-input";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/components/lib/format";
import { PasswordInput } from "@/components/auth/password-input";
import {
  emptyBillingForm,
  MenuBillingFields,
  type BillingFormState,
} from "@/components/admin/menu-billing-fields";
import { parseBillingInput } from "@/lib/menu-billing";
import { BusinessTypePicker } from "@/components/restaurants/business-type-picker";
import { isRestaurantActivated } from "@/lib/restaurant-status";
import { BUSINESS_TYPE_OPTIONS, normalizeBusinessType } from "@/lib/business-type";
import type { BusinessType, Restaurant, RestaurantStatus } from "@/lib/types";

const PAGE_SIZE = 10;

type RestaurantRow = Restaurant & { owner_name?: string | null };

const STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: "TRIAL", label: "تجريبي" },
  { value: "ACTIVE", label: "نشط" },
  { value: "SUSPENDED", label: "معلّق" },
  { value: "EXPIRED", label: "منتهي" },
  { value: "CANCELLED", label: "ملغى" },
];

export function AdminRestaurantsView({ restaurants = [] }: { restaurants?: RestaurantRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | RestaurantStatus>("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Restaurant | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState<"restaurant" | "cars" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("RESTAURANT");
  const [billing, setBilling] = useState<BillingFormState>(emptyBillingForm());
  const [editing, setEditing] = useState<RestaurantRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<RestaurantStatus>("SUSPENDED");
  const [editBusinessType, setEditBusinessType] = useState<BusinessType>("RESTAURANT");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (restaurants ?? [])
      .filter((item) => (status === "ALL" ? true : item.status === status))
      .filter((item) =>
        `${item.name} ${item.slug} ${item.owner_name ?? ""}`.toLowerCase().includes(needle)
      )
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name, "ar") : b.created_at.localeCompare(a.created_at)
      );
  }, [restaurants, query, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const billingInput = parseBillingInput(billing);
  const canCreate = Boolean(name.trim() && email.trim() && password.length >= 8 && "value" in billingInput);
  const canSave = Boolean(editName.trim() && editSlug.trim());

  function openEdit(restaurant: RestaurantRow) {
    setEditing(restaurant);
    setEditName(restaurant.name);
    setEditSlug(restaurant.slug);
    setEditPhone(restaurant.phone ?? "");
    setEditDescription(restaurant.description ?? "");
    setEditStatus(restaurant.status);
    setEditBusinessType(normalizeBusinessType(restaurant.business_type));
  }

  async function createRestaurant() {
    setSaving(true);
    try {
      const result = await adminCreateRestaurant({
        name: name.trim(),
        email: email.trim(),
        password,
        business_type: businessType,
        billing: "value" in billingInput ? billingInput.value : undefined,
      });
      if (result.error) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({ title: "تم إنشاء المطعم والحساب. فعّله ليتمكن المالك من الدخول.", variant: "success" });
      setCreating(false);
      setName("");
      setEmail("");
      setPassword("");
      setBusinessType("RESTAURANT");
      setBilling(emptyBillingForm());
      router.refresh();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "تعذر إنشاء المطعم",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveRestaurant() {
    if (!editing) return;
    setSaving(true);
    const result = await adminUpdateRestaurant({
      id: editing.id,
      name: editName,
      slug: editSlug,
      phone: editPhone,
      description: editDescription,
      status: editStatus,
      business_type: editBusinessType,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ المطعم", variant: "success" });
    setEditing(null);
    router.refresh();
  }

  async function createDemoMenu() {
    setSeeding("restaurant");
    const result = await seedDemoMenu();
    setSeeding(null);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم تجهيز منيو بيت الشام التجريبي", variant: "success" });
    router.refresh();
  }

  async function createDemoCarsMenu() {
    setSeeding("cars");
    const result = await seedDemoCarsMenu();
    setSeeding(null);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم تجهيز منيو أوتو الشام التجريبي", variant: "success" });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="المطاعم"
        description="إنشاء المواقع وتعديلها وتفعيلها وتحديد نوع النشاط يتم من هنا."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={seeding === "restaurant"} onClick={() => void createDemoMenu()}>
              تجهيز منيو المطعم
            </Button>
            <Button variant="outline" loading={seeding === "cars"} onClick={() => void createDemoCarsMenu()}>
              تجهيز منيو السيارات
            </Button>
            <Button onClick={() => setCreating(true)}>إنشاء مطعم</Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <Select
          value={status}
          onChange={(value) => setStatus(value as typeof status)}
          options={[{ value: "ALL", label: "كل الحالات" }, ...STATUS_OPTIONS]}
        />
        <Select
          value={sort}
          onChange={setSort}
          options={[
            { value: "newest", label: "الأحدث" },
            { value: "name", label: "الاسم" },
          ]}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[48rem] text-start text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">المطعم</th>
              <th className="p-3 text-start">نوع النشاط</th>
              <th className="p-3 text-start">المالك</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">تاريخ الإنشاء</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  لا توجد مطاعم مطابقة.
                </td>
              </tr>
            ) : (
              rows.map((restaurant) => (
                <tr key={restaurant.id} className="border-t border-zinc-100">
                  <td className="p-3">
                    <p className="font-medium">{restaurant.name}</p>
                    <p className="text-xs text-zinc-400" dir="ltr">
                      {restaurant.slug}
                    </p>
                  </td>
                  <td className="p-3">
                    {BUSINESS_TYPE_OPTIONS.find(
                      (option) => option.value === normalizeBusinessType(restaurant.business_type)
                    )?.label ?? "—"}
                  </td>
                  <td className="p-3">{restaurant.owner_name ?? "—"}</td>
                  <td className="p-3">
                    <StatusBadge kind="restaurant" value={restaurant.status} />
                  </td>
                  <td className="p-3">{formatDate(restaurant.created_at)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => window.open(`/m/${restaurant.slug}`, "_blank")}>
                        عرض
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(restaurant)}>
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant={isRestaurantActivated(restaurant.status) ? "outline" : "primary"}
                        onClick={async () => {
                          const nextStatus = isRestaurantActivated(restaurant.status) ? "SUSPENDED" : "ACTIVE";
                          const result = await adminSetRestaurantStatus(restaurant.id, nextStatus);
                          if (result.error) toast({ title: result.error, variant: "error" });
                          else {
                            toast({
                              title: nextStatus === "ACTIVE" ? "تم تفعيل المطعم" : "تم تعليق المطعم",
                              variant: "success",
                            });
                            router.refresh();
                          }
                        }}
                      >
                        {isRestaurantActivated(restaurant.status) ? "تعليق" : "تفعيل"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleting(restaurant)}>
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
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف المطعم؟"
        description="سيتم حذف المطعم وكل بياناته."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await adminDeleteRestaurant(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف المطعم", variant: "success" });
            router.refresh();
          }
        }}
      />
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="إنشاء مطعم"
        size="lg"
        description="أدخل بيانات النشاط والحساب، ثم سعر المنيو والحسم والتقسيط والتجديد السنوي."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!canCreate} onClick={() => void createRestaurant()}>
              إنشاء
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="اسم المطعم" htmlFor="admin-restaurant-name" required>
            <Input id="admin-restaurant-name" value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <BusinessTypePicker value={businessType} onChange={setBusinessType} disabled={saving} />
          <FormField label="البريد الإلكتروني" htmlFor="admin-restaurant-email" required>
            <Input
              id="admin-restaurant-email"
              type="email"
              dir="ltr"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label="كلمة المرور" htmlFor="admin-restaurant-password" required hint="8 أحرف على الأقل">
            <PasswordInput
              id="admin-restaurant-password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
          </FormField>
          <MenuBillingFields value={billing} onChange={setBilling} disabled={saving} />
        </div>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل المطعم"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button loading={saving} disabled={!canSave} onClick={() => void saveRestaurant()}>
              حفظ
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="اسم المطعم" htmlFor="edit-restaurant-name" required>
            <Input id="edit-restaurant-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
          </FormField>
          <FormField label="الرابط" htmlFor="edit-restaurant-slug" required>
            <Input id="edit-restaurant-slug" dir="ltr" value={editSlug} onChange={(event) => setEditSlug(event.target.value)} />
          </FormField>
          <FormField label="الهاتف" htmlFor="edit-restaurant-phone">
            <Input id="edit-restaurant-phone" dir="ltr" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
          </FormField>
          <FormField label="الوصف" htmlFor="edit-restaurant-description">
            <Textarea
              id="edit-restaurant-description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
            />
          </FormField>
          <BusinessTypePicker value={editBusinessType} onChange={setEditBusinessType} disabled={saving} />
          <FormField label="الحالة" htmlFor="edit-restaurant-status">
            <Select
              id="edit-restaurant-status"
              value={editStatus}
              onChange={(value) => setEditStatus(value as RestaurantStatus)}
              options={STATUS_OPTIONS}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}

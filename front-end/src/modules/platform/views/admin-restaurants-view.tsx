"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateRestaurant,
  adminDeleteRestaurant,
  adminSetRestaurantStatus,
  adminUpdateRestaurant,
} from "@/modules/platform/actions/admin";
import { seedDemoCarsMenu, seedDemoMenu } from "@/modules/platform/actions/admin";
import { PageHeader } from "@/core/components/layout/page-header";
import { SearchInput } from "@/core/components/common/search-input";
import { StatusBadge } from "@/core/components/common/status-badge";
import { Button } from "@/core/ui/button";
import { Select } from "@/core/ui/select";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
import { Dialog } from "@/core/ui/dialog";
import { Pagination } from "@/core/ui/pagination";
import { FormField } from "@/core/components/forms/form-field";
import { Input } from "@/core/ui/input";
import { Textarea } from "@/core/ui/textarea";
import { useToast } from "@/core/ui/toast";
import { formatDate } from "@/core/lib/format";
import { PasswordInput } from "@/modules/auth/components/password-input";
import {
  emptyBillingForm,
  MenuBillingFields,
  type BillingFormState,
} from "@/modules/finance/components/menu-billing-fields";
import { parseBillingInput } from "@/modules/finance/lib/menu-billing";
import { BusinessTypePicker } from "@/modules/tenancy/components/restaurants/business-type-picker";
import { setCurrentRestaurant } from "@/modules/tenancy/actions/restaurants";
import { isRestaurantActivated } from "@/modules/tenancy/lib/restaurant-status";
import { BUSINESS_TYPE_OPTIONS, normalizeBusinessType } from "@/modules/tenancy/lib/business-type";
import type { BusinessType, Restaurant, RestaurantStatus } from "@/modules/tenancy/types";

const PAGE_SIZE = 10;

type RestaurantRow = Restaurant & {
  owner_name?: string | null;
  owner_email?: string | null;
  owner_password?: string | null;
};

const STATUS_OPTIONS: { value: RestaurantStatus; label: string }[] = [
  { value: "TRIAL", label: "تجريبي" },
  { value: "ACTIVE", label: "نشط" },
  { value: "SUSPENDED", label: "معلّق" },
  { value: "EXPIRED", label: "منتهي" },
  { value: "CANCELLED", label: "ملغى" },
];

export function AdminRestaurantsView({
  restaurants = [],
  malls = [],
  lockedMall = null,
}: {
  restaurants?: RestaurantRow[];
  malls?: { id: string; name: string }[];
  /** Set for a mall manager: every new menu is forced into this mall. */
  lockedMall?: { id: string; name: string } | null;
}) {
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
  const [affiliation, setAffiliation] = useState("private");
  const [billing, setBilling] = useState<BillingFormState>(emptyBillingForm());
  const [editing, setEditing] = useState<RestaurantRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<RestaurantStatus>("SUSPENDED");
  const [editBusinessType, setEditBusinessType] = useState<BusinessType>("RESTAURANT");
  const [editMallId, setEditMallId] = useState("private");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

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
  const canSave = Boolean(editName.trim() && editSlug.trim() && editEmail.trim());

  function openEdit(restaurant: RestaurantRow) {
    setEditing(restaurant);
    setEditName(restaurant.name);
    setEditSlug(restaurant.slug);
    setEditPhone(restaurant.phone ?? "");
    setEditDescription(restaurant.description ?? "");
    setEditStatus(restaurant.status);
    setEditBusinessType(normalizeBusinessType(restaurant.business_type));
    setEditMallId(restaurant.mall_id ?? "private");
    setEditEmail(restaurant.owner_email ?? "");
    setEditPassword(restaurant.owner_password ?? "");
  }

  async function createRestaurant() {
    setSaving(true);
    try {
      const result = await adminCreateRestaurant({
        name: name.trim(),
        email: email.trim(),
        password,
        business_type: businessType,
        mall_id: lockedMall ? undefined : affiliation === "private" ? null : affiliation,
        billing: "value" in billingInput ? billingInput.value : undefined,
      });
      if (result.error) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({ title: "تم إنشاء المحل والحساب. فعّله ليتمكن المالك من الدخول.", variant: "success" });
      setCreating(false);
      setName("");
      setEmail("");
      setPassword("");
      setBusinessType("RESTAURANT");
      setAffiliation("private");
      setBilling(emptyBillingForm());
      router.refresh();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "تعذر إنشاء المحل",
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
      mall_id: lockedMall ? undefined : editMallId === "private" ? null : editMallId,
      owner_email: editEmail,
      owner_password: editPassword.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ المحل", variant: "success" });
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
        title="المحلات"
        description={
          lockedMall
            ? `منيوهات ${lockedMall.name} فقط. كل محل جديد يُربط بهذا المول.`
            : "أنشئ منيو تابع لمول أو منيو محل خاص، ثم فعّله ليظهر للزوار."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {lockedMall ? null : (
              <>
                <Button variant="outline" loading={seeding === "restaurant"} onClick={() => void createDemoMenu()}>
                  تجهيز منيو المطعم
                </Button>
                <Button variant="outline" loading={seeding === "cars"} onClick={() => void createDemoCarsMenu()}>
                  تجهيز منيو السيارات
                </Button>
              </>
            )}
            <Button onClick={() => setCreating(true)}>إنشاء محل</Button>
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
              <th className="p-3 text-start">المحل</th>
              <th className="p-3 text-start">نوع النشاط</th>
              {lockedMall ? null : <th className="p-3 text-start">الانتماء</th>}
              <th className="p-3 text-start">المالك</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">تاريخ الإنشاء</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={lockedMall ? 6 : 7} className="p-8 text-center text-zinc-500">
                  لا توجد محلات مطابقة.
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
                  {lockedMall ? null : (
                    <td className="p-3">{restaurant.mall?.name ?? "محل خاص"}</td>
                  )}
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
                      {lockedMall && isRestaurantActivated(restaurant.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const result = await setCurrentRestaurant(restaurant.id);
                            if (result.error) toast({ title: result.error, variant: "error" });
                            else router.push("/dashboard");
                          }}
                        >
                          إدارة المنيو
                        </Button>
                      ) : null}
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
                              title: nextStatus === "ACTIVE" ? "تم تفعيل المحل" : "تم تعليق المحل",
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
        title="حذف المحل؟"
        description="سيتم حذف المحل وكل بياناته."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await adminDeleteRestaurant(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف المحل", variant: "success" });
            router.refresh();
          }
        }}
      />
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="إنشاء محل"
        size="lg"
        description="أدخل بيانات النشاط والحساب، ثم سعر سنة الاشتراك. بعد السنة يتوقف المنيو حتى يُحدد سعر جديد."
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
          <FormField label="اسم المحل" htmlFor="admin-restaurant-name" required>
            <Input id="admin-restaurant-name" value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <BusinessTypePicker value={businessType} onChange={setBusinessType} disabled={saving} />
          {lockedMall ? (
            <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">
              هذا المنيو سيظهر في دليل {lockedMall.name}.
            </p>
          ) : (
            <FormField label="الانتماء" htmlFor="admin-restaurant-mall" required>
              <Select
                id="admin-restaurant-mall"
                value={affiliation}
                onChange={setAffiliation}
                options={[
                  { value: "private", label: "محل خاص" },
                  ...malls.map((mall) => ({ value: mall.id, label: mall.name })),
                ]}
              />
            </FormField>
          )}
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
        title="تعديل المحل"
        size="lg"
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
          <FormField label="اسم المحل" htmlFor="edit-restaurant-name" required>
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
          {lockedMall ? null : (
            <FormField label="الانتماء" htmlFor="edit-restaurant-mall">
              <Select
                id="edit-restaurant-mall"
                value={editMallId}
                onChange={setEditMallId}
                options={[
                  { value: "private", label: "محل خاص" },
                  ...malls.map((mall) => ({ value: mall.id, label: mall.name })),
                ]}
              />
            </FormField>
          )}
          <FormField label="الحالة" htmlFor="edit-restaurant-status">
            <Select
              id="edit-restaurant-status"
              value={editStatus}
              onChange={(value) => setEditStatus(value as RestaurantStatus)}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <FormField label="بريد المالك" htmlFor="edit-owner-email" required>
            <Input
              id="edit-owner-email"
              type="email"
              dir="ltr"
              autoComplete="off"
              value={editEmail}
              onChange={(event) => setEditEmail(event.target.value)}
            />
          </FormField>
          <FormField
            label="كلمة مرور المالك"
            htmlFor="edit-owner-password"
            hint="8 أحرف على الأقل"
          >
            <PasswordInput
              id="edit-owner-password"
              autoComplete="new-password"
              required={false}
              value={editPassword}
              onChange={setEditPassword}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}

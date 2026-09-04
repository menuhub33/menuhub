"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminChangeRestaurantPlan,
  adminCreateRestaurant,
  adminDeleteRestaurant,
  adminSetRestaurantBusinessType,
  adminSetRestaurantStatus,
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
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/components/lib/format";
import { PasswordInput } from "@/components/auth/password-input";
import { BusinessTypePicker } from "@/components/restaurants/business-type-picker";
import { isRestaurantActivated } from "@/lib/restaurant-status";
import {
  BUSINESS_TYPE_OPTIONS,
  normalizeBusinessType,
} from "@/lib/business-type";
import type { BusinessType, Plan, Restaurant, RestaurantStatus } from "@/lib/types";

const PAGE_SIZE = 10;

export function AdminRestaurantsView({
  restaurants = [],
  plans = [],
}: {
  restaurants?: (Restaurant & { owner_name?: string | null; plan_name?: string | null })[];
  plans?: Plan[];
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

  const planRows = plans ?? [];

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
  const canCreate = Boolean(name.trim() && email.trim() && password.length >= 8);

  async function createRestaurant() {
    setSaving(true);
    try {
      const result = await adminCreateRestaurant({
        name: name.trim(),
        email: email.trim(),
        password,
        business_type: businessType,
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
        description="إنشاء المواقع وتفعيلها وتحديد نوع النشاط يتم من هنا فقط. صاحب المنيو لا يستطيع تغيير نوع النشاط."
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
          options={[
            { value: "ALL", label: "كل الحالات" },
            { value: "TRIAL", label: "تجريبي" },
            { value: "ACTIVE", label: "نشط" },
            { value: "SUSPENDED", label: "معلّق" },
            { value: "EXPIRED", label: "منتهي" },
            { value: "CANCELLED", label: "ملغى" },
          ]}
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
              <th className="p-3">المطعم</th>
              <th className="p-3">نوع النشاط</th>
              <th className="p-3">المالك</th>
              <th className="p-3">الخطة</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">تاريخ الإنشاء</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((restaurant) => (
              <tr key={restaurant.id} className="border-t border-zinc-100">
                <td className="p-3">
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-xs text-zinc-400" dir="ltr">{restaurant.slug}</p>
                </td>
                <td className="p-3">
                  <Select
                    value={normalizeBusinessType(restaurant.business_type)}
                    onChange={async (value) => {
                      const result = await adminSetRestaurantBusinessType(
                        restaurant.id,
                        value as BusinessType
                      );
                      if (result.error) toast({ title: result.error, variant: "error" });
                      else {
                        toast({ title: "تم حفظ نوع النشاط", variant: "success" });
                        router.refresh();
                      }
                    }}
                    options={BUSINESS_TYPE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                  />
                </td>
                <td className="p-3">{restaurant.owner_name ?? "—"}</td>
                <td className="p-3">{restaurant.plan_name ?? "—"}</td>
                <td className="p-3"><StatusBadge kind="restaurant" value={restaurant.status} /></td>
                <td className="p-3">{formatDate(restaurant.created_at)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => window.open(`/m/${restaurant.slug}`, "_blank")}>
                      عرض
                    </Button>
                    <Button
                      size="sm"
                      variant={isRestaurantActivated(restaurant.status) ? "outline" : "primary"}
                      onClick={async () => {
                        const nextStatus = isRestaurantActivated(restaurant.status)
                          ? "SUSPENDED"
                          : "ACTIVE";
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
                    <Select
                      value={planRows.find((plan) => plan.name === restaurant.plan_name)?.id ?? ""}
                      onChange={async (planId) => {
                        const result = await adminChangeRestaurantPlan(restaurant.id, planId);
                        if (result.error) toast({ title: result.error, variant: "error" });
                        else router.refresh();
                      }}
                      options={planRows.map((plan) => ({ value: plan.id, label: plan.name }))}
                    />
                    <Button size="sm" variant="danger" onClick={() => setDeleting(restaurant)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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
            router.refresh();
          }
        }}
      />
      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="إنشاء مطعم"
        description="أدخل اسم النشاط ونوعه وبريد المالك وكلمة المرور. يُنشأ الحساب والموقع معاً، ثم اضغط تفعيل ليتمكن المالك من فتح لوحة التحكم."
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
            <Input
              id="admin-restaurant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
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
          <FormField
            label="كلمة المرور"
            htmlFor="admin-restaurant-password"
            required
            hint="8 أحرف على الأقل"
          >
            <PasswordInput
              id="admin-restaurant-password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}

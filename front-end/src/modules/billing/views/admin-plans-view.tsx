"use client";

import { useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { createPlan, updatePlan, updatePlanStatus } from "@/modules/billing/actions/billing";
import { formatLimit, formatStorageLimit } from "@/modules/billing/components/plan-card";
import { PageHeader } from "@/core/components/layout/page-header";
import { FormField } from "@/core/components/forms/form-field";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { useToast } from "@/core/ui/toast";
import { formatPrice } from "@/core/lib/format";
import type { Plan } from "@/modules/billing/types";

type LimitField =
  | "max_menus"
  | "max_categories"
  | "max_products"
  | "max_product_images"
  | "max_storage_mb";

type Draft = {
  name: string;
  slug: string;
  price_monthly: string;
  price_yearly: string;
  max_menus: string;
  max_categories: string;
  max_products: string;
  max_product_images: string;
  max_storage_mb: string;
};

const LIMIT_FIELDS: { key: LimitField; label: string; hint: string }[] = [
  { key: "max_menus", label: "عدد القوائم", hint: "فارغ = بلا حد" },
  { key: "max_categories", label: "عدد الأقسام", hint: "فارغ = بلا حد" },
  { key: "max_products", label: "عدد المنتجات", hint: "فارغ = بلا حد" },
  { key: "max_product_images", label: "صور لكل منتج", hint: "من 1 إلى 12" },
  { key: "max_storage_mb", label: "التخزين (MB)", hint: "1200 = 1.2 GB" },
];

function blankDraft(): Draft {
  return {
    name: "",
    slug: "",
    price_monthly: "0",
    price_yearly: "0",
    max_menus: "",
    max_categories: "",
    max_products: "",
    max_product_images: "",
    max_storage_mb: "",
  };
}

function draftFromPlan(plan: Plan): Draft {
  return {
    name: plan.name,
    slug: plan.slug,
    price_monthly: String(plan.price_monthly),
    price_yearly: String(plan.price_yearly),
    max_menus: plan.max_menus == null ? "" : String(plan.max_menus),
    max_categories: plan.max_categories == null ? "" : String(plan.max_categories),
    max_products: plan.max_products == null ? "" : String(plan.max_products),
    max_product_images: plan.max_product_images == null ? "" : String(plan.max_product_images),
    max_storage_mb: plan.max_storage_mb == null ? "" : String(plan.max_storage_mb),
  };
}

function readPrice(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function readLimit(value: string, max?: number): number | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return "invalid";
  const parsed = Number(trimmed);
  if (parsed < 1 || (max != null && parsed > max)) return "invalid";
  return parsed;
}

export function AdminPlansView({ plans }: { plans: Plan[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setDraft(blankDraft());
  }

  function openEdit(plan: Plan) {
    setCreating(false);
    setEditing(plan);
    setDraft(draftFromPlan(plan));
  }

  function closeDialog() {
    setEditing(null);
    setCreating(false);
  }

  async function savePlan() {
    const priceMonthly = readPrice(draft.price_monthly);
    const priceYearly = readPrice(draft.price_yearly);
    if (!draft.name.trim()) {
      toast({ title: "اسم الخطة مطلوب", variant: "error" });
      return;
    }
    if (priceMonthly == null || priceYearly == null) {
      toast({ title: "أدخل سعراً شهرياً وسنوياً صحيحاً", variant: "error" });
      return;
    }
    const slug = draft.slug.trim().toLowerCase();
    if (creating && slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast({ title: "المعرّف أحرف إنجليزية صغيرة وأرقام وشرطات فقط، أو اتركه فارغاً", variant: "error" });
      return;
    }

    const limits = {} as Record<LimitField, number | null>;
    for (const field of LIMIT_FIELDS) {
      const max = field.key === "max_product_images" ? 12 : field.key === "max_storage_mb" ? 102400 : undefined;
      const value = readLimit(draft[field.key], max);
      if (value === "invalid") {
        toast({ title: `${field.label} غير صالح`, variant: "error" });
        return;
      }
      limits[field.key] = value;
    }

    setSaving(true);
    const result = creating
      ? await createPlan({
          name: draft.name,
          slug,
          price_monthly: priceMonthly,
          price_yearly: priceYearly,
          ...limits,
        })
      : await updatePlan({
          id: editing?.id ?? "",
          name: draft.name,
          price_monthly: priceMonthly,
          price_yearly: priceYearly,
          ...limits,
        });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    closeDialog();
    toast({ title: creating ? "أُضيفت الخطة" : "تم حفظ الخطة", variant: "success" });
    reloadPage();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الخطط"
        description="سقوف القوائم والأقسام والمنتجات والصور والتخزين. اترك حدّاً فارغاً ليبقى بلا سقف."
        actions={
          <Button onClick={openCreate}>إضافة خطة</Button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[64rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">الخطة</th>
              <th className="p-3 text-start">الشهري</th>
              <th className="p-3 text-start">السنوي</th>
              <th className="p-3 text-start">القوائم</th>
              <th className="p-3 text-start">الأقسام</th>
              <th className="p-3 text-start">المنتجات</th>
              <th className="p-3 text-start">صور المنتج</th>
              <th className="p-3 text-start">التخزين</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-zinc-500">
                  لا توجد خطط.
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-t border-zinc-100">
                  <td className="p-3">
                    <p className="font-medium text-zinc-900">{plan.name}</p>
                    <p className="text-xs text-zinc-400" dir="ltr">
                      {plan.slug}
                    </p>
                  </td>
                  <td className="p-3">{formatPrice(plan.price_monthly, plan.currency)}</td>
                  <td className="p-3">{formatPrice(plan.price_yearly, plan.currency)}</td>
                  <td className="p-3">{formatLimit(plan.max_menus)}</td>
                  <td className="p-3">{formatLimit(plan.max_categories)}</td>
                  <td className="p-3">{formatLimit(plan.max_products)}</td>
                  <td className="p-3">{formatLimit(plan.max_product_images)}</td>
                  <td className="p-3">{formatStorageLimit(plan.max_storage_mb)}</td>
                  <td className="p-3">{plan.is_active ? "مفعّلة" : "موقوفة"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const result = await updatePlanStatus(plan.id, !plan.is_active);
                          if (result.error) toast({ title: result.error, variant: "error" });
                          else reloadPage();
                        }}
                      >
                        {plan.is_active ? "إيقاف" : "تفعيل"}
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
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={creating ? "إضافة خطة" : editing ? `تعديل ${editing.name}` : "الخطة"}
        description="السقوف تُطبَّق على المحلات المشتركة في هذه الخطة. اترك حدّاً فارغاً ليبقى بلا سقف."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeDialog}>
              إلغاء
            </Button>
            <Button loading={saving} onClick={() => void savePlan()}>
              {creating ? "إضافة" : "حفظ"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" htmlFor="plan-name" required>
            <Input
              id="plan-name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </FormField>
          {creating ? (
            <FormField
              label="المعرّف"
              htmlFor="plan-slug"
              hint="اختياري. أحرف إنجليزية مثل gold، أو اتركه فارغاً ليُنشأ تلقائياً."
            >
              <Input
                id="plan-slug"
                dir="ltr"
                value={draft.slug}
                placeholder="gold"
                onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              />
            </FormField>
          ) : (
            <FormField label="المعرّف">
              <Input dir="ltr" value={editing?.slug ?? ""} disabled />
            </FormField>
          )}
          <FormField label="السعر الشهري" htmlFor="plan-monthly" required>
            <Input
              id="plan-monthly"
              type="number"
              min={0}
              value={draft.price_monthly}
              onChange={(event) => setDraft({ ...draft, price_monthly: event.target.value })}
            />
          </FormField>
          <FormField label="السعر السنوي" htmlFor="plan-yearly" required>
            <Input
              id="plan-yearly"
              type="number"
              min={0}
              value={draft.price_yearly}
              onChange={(event) => setDraft({ ...draft, price_yearly: event.target.value })}
            />
          </FormField>
          {LIMIT_FIELDS.map((field) => (
            <FormField key={field.key} label={field.label} hint={field.hint} htmlFor={field.key}>
              <Input
                id={field.key}
                inputMode="numeric"
                value={draft[field.key]}
                placeholder="بلا حد"
                onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
              />
            </FormField>
          ))}
        </div>
      </Dialog>
    </div>
  );
}

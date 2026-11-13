"use client";

import { useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { createPlan, deletePlan, updatePlan, updatePlanStatus, updatePosPricing } from "@/modules/billing/actions/billing";
import type { PosPricing } from "@/modules/finance/lib/menu-billing";
import { Select } from "@/core/ui/select";
import { formatLimit, formatStorageLimit } from "@/modules/billing/components/plan-card";
import { PageHeader } from "@/core/components/layout/page-header";
import { FormField } from "@/core/components/forms/form-field";
import { Button } from "@/core/ui/button";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
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

const POS_CURRENCIES = ["USD", "SYP", "TRY", "EUR", "SAR", "AED"];

/** Yearly price of each POS package. It is added to a restaurant's contract price when the package is chosen. */
function PosPricingCard({ pricing }: { pricing: PosPricing }) {
  const { toast } = useToast();
  const [cashier, setCashier] = useState(String(pricing.cashier));
  const [cashierWaiter, setCashierWaiter] = useState(String(pricing.cashier_waiter));
  const [currency, setCurrency] = useState(pricing.currency);
  const [saving, setSaving] = useState(false);

  const cashierValue = readPrice(cashier);
  const cashierWaiterValue = readPrice(cashierWaiter);
  const dirty =
    cashierValue !== pricing.cashier ||
    cashierWaiterValue !== pricing.cashier_waiter ||
    currency !== pricing.currency;

  async function save() {
    if (cashierValue == null || cashierWaiterValue == null) {
      toast({ title: "أدخل سعراً صحيحاً للحزمتين", variant: "error" });
      return;
    }
    setSaving(true);
    const result = await updatePosPricing({
      cashier: cashierValue,
      cashier_waiter: cashierWaiterValue,
      currency,
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ أسعار نقطة البيع", variant: "success" });
    reloadPage();
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">أسعار نقطة البيع (POS)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          سعر سنوي لكل حزمة. عند اختيار الحزمة لمحل يُضاف سعرها إلى سعر خطته في العقد المالي. اجعل السعر 0 لحزمة بلا
          رسوم.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="كاشير فقط" htmlFor="pos-price-cashier" hint="سعر سنوي">
          <Input
            id="pos-price-cashier"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            value={cashier}
            onChange={(event) => setCashier(event.target.value)}
          />
        </FormField>
        <FormField label="كاشير ونادل" htmlFor="pos-price-cashier-waiter" hint="سعر سنوي">
          <Input
            id="pos-price-cashier-waiter"
            type="number"
            min={0}
            step="0.01"
            dir="ltr"
            value={cashierWaiter}
            onChange={(event) => setCashierWaiter(event.target.value)}
          />
        </FormField>
        <FormField label="العملة" htmlFor="pos-price-currency" hint="يجب أن تطابق عملة خطط المحلات">
          <Select
            id="pos-price-currency"
            value={currency}
            onChange={setCurrency}
            options={POS_CURRENCIES.map((code) => ({ value: code, label: code }))}
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button loading={saving} disabled={!dirty} onClick={() => void save()}>
          حفظ الأسعار
        </Button>
      </div>
    </section>
  );
}

export function AdminPlansView({ plans, posPricing }: { plans: Plan[]; posPricing: PosPricing }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);

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

      <PosPricingCard pricing={posPricing} />

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
                      {plan.slug === "free" ? null : (
                        <Button size="sm" variant="outline" onClick={() => setDeleting(plan)}>
                          حذف
                        </Button>
                      )}
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
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={deleting ? `حذف خطة ${deleting.name}؟` : "حذف الخطة؟"}
        description="لا يمكن حذف خطة مرتبطة باشتراكات محلات؛ أوقفها بدلاً من ذلك. العقود المالية القديمة تحتفظ بسعرها."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deletePlan(deleting.id);
          if (result.error) {
            toast({ title: result.error, variant: "error" });
            return;
          }
          setDeleting(null);
          toast({ title: "تم حذف الخطة", variant: "success" });
          reloadPage();
        }}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import {
  deleteMenuBilling,
  saveMenuBilling,
  setInstallmentPaid,
  type FinanceContract,
} from "@/modules/finance/actions/finance";
import {
  billingFormFromContract,
  emptyBillingForm,
  MenuBillingFields,
  type BillingFormState,
} from "@/modules/finance/components/menu-billing-fields";
import { PageHeader } from "@/core/components/layout/page-header";
import { SearchInput } from "@/core/components/common/search-input";
import { StatCard } from "@/modules/analytics/components/dashboard/stat-card";
import { formatDate, formatPrice } from "@/core/lib/format";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
import { Dialog } from "@/core/ui/dialog";
import { FormField } from "@/core/components/forms/form-field";
import { Select } from "@/core/ui/select";
import { useToast } from "@/core/ui/toast";
import { parseBillingInput, contractProfit, type PosMode, type PosPricing, type PricedPlan } from "@/modules/finance/lib/menu-billing";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function discountLabel(contract: FinanceContract) {
  if (contract.discount_type === "PERCENT") return `${contract.discount_value}%`;
  if (contract.discount_type === "AMOUNT") return formatPrice(contract.discount_value, contract.currency);
  return "بدون";
}

export function AdminFinanceView({
  contracts,
  restaurants,
  plans = [],
  posPricing = null,
  mallName = null,
}: {
  contracts: FinanceContract[];
  restaurants: { id: string; name: string; pos_mode?: PosMode }[];
  plans?: PricedPlan[];
  /** Yearly POS package prices (platform admins only); added to the contract price. */
  posPricing?: PosPricing | null;
  mallName?: string | null;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [form, setForm] = useState<BillingFormState>(emptyBillingForm());
  const [editing, setEditing] = useState<FinanceContract | null>(null);
  const [payments, setPayments] = useState<FinanceContract | null>(null);
  const [deleting, setDeleting] = useState<FinanceContract | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contracts.filter((contract) => {
      const dues = contract.installments.filter((item) => item.kind === "INSTALLMENT");
      const paid = dues.filter((item) => item.status === "PAID").length;
      const overdue = dues.some((item) => item.status === "PENDING" && item.due_on < todayIso());
      const state = paid === dues.length && dues.length > 0 ? "PAID" : overdue ? "OVERDUE" : paid > 0 ? "PARTIAL" : "PENDING";
      const matchesFilter = filter === "ALL" || filter === state;
      const matchesQuery = `${contract.restaurant_name}`.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [contracts, query, filter]);

  const totals = useMemo(() => {
    const byCurrency = {
      USD: { profit: 0, collected: 0, remaining: 0, count: 0 },
      SYP: { profit: 0, collected: 0, remaining: 0, count: 0 },
    };
    for (const contract of contracts) {
      const bucket = contract.currency === "USD" ? byCurrency.USD : contract.currency === "SYP" ? byCurrency.SYP : null;
      if (bucket) {
        bucket.count += 1;
        bucket.profit += contractProfit(
          contract.price,
          contract.discount_type,
          contract.discount_value,
          contract.setup_cost
        );
      }
      for (const item of contract.installments) {
        if (!bucket || item.kind !== "INSTALLMENT") continue;
        if (item.status === "PAID") bucket.collected += item.amount;
        if (item.status === "PENDING") bucket.remaining += item.amount;
      }
    }
    return byCurrency;
  }, [contracts]);

  const linked = new Set(contracts.map((contract) => contract.restaurant_id));
  const available = restaurants.filter((restaurant) => !linked.has(restaurant.id));

  /** The POS package that is added to a contract is the one the restaurant currently has. */
  function posOptions(targetId: string) {
    const mode = restaurants.find((restaurant) => restaurant.id === targetId)?.pos_mode ?? "OFF";
    return { mode, pricing: posPricing };
  }

  async function save(targetId: string) {
    const parsed = parseBillingInput(form, plans, posOptions(targetId));
    if ("error" in parsed) {
      toast({ title: parsed.error, variant: "error" });
      return;
    }
    setSaving(true);
    const result = await saveMenuBilling(targetId, parsed.value);
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ العقد المالي", variant: "success" });
    setCreating(false);
    setEditing(null);
    setForm(emptyBillingForm(plans[0]?.id ?? ""));
    reloadPage();
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title={mallName ? "الحالة المالية" : "الإدارة المالية"}
        description={
          mallName
            ? `عقود محلات ${mallName} فقط. الاشتراك لسنة واحدة ثم يتوقف المنيو حتى يُحدد سعر جديد.`
            : "سعر كل منيو لسنة واحدة. بعد انتهائها يتوقف المنيو حتى يُحدد سعر جديد."
        }
        actions={
          <Button
            onClick={() => {
              setRestaurantId(available[0]?.id ?? "");
              setForm(emptyBillingForm(plans[0]?.id ?? ""));
              setCreating(true);
            }}
            disabled={available.length === 0}
          >
            عقد جديد
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="دولار"
          value={formatPrice(totals.USD.profit, "USD")}
          hint={`الربح الصافي · ${totals.USD.count} عقود · محصّل ${formatPrice(totals.USD.collected, "USD")}`}
        />
        <StatCard
          label="سوري"
          value={formatPrice(totals.SYP.profit, "SYP")}
          hint={`الربح الصافي · ${totals.SYP.count} عقود · محصّل ${formatPrice(totals.SYP.collected, "SYP")}`}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SearchInput value={query} onChange={setQuery} />
        <Select
          value={filter}
          onChange={setFilter}
          options={[
            { value: "ALL", label: "كل العقود" },
            { value: "PENDING", label: "بانتظار الدفع" },
            { value: "PARTIAL", label: "تقسيط جزئي" },
            { value: "OVERDUE", label: "متأخر" },
            { value: "PAID", label: "مسدّد" },
          ]}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="p-3 text-start">المحل</th>
              <th className="p-3 text-start">سعر المنيو</th>
              <th className="p-3 text-start">التكلفة</th>
              <th className="p-3 text-start">الحسم</th>
              <th className="p-3 text-start">الربح</th>
              <th className="p-3 text-start">نهاية الاشتراك</th>
              <th className="p-3 text-start">التقسيط</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-500">
                  لا توجد عقود مالية.
                </td>
              </tr>
            ) : (
              rows.map((contract) => {
                const dues = contract.installments.filter((item) => item.kind === "INSTALLMENT");
                const paid = dues.filter((item) => item.status === "PAID").length;
                const profit = contractProfit(
                  contract.price,
                  contract.discount_type,
                  contract.discount_value,
                  contract.setup_cost
                );
                return (
                  <tr key={contract.id} className="border-t border-zinc-100">
                    <td className="p-3 font-medium">{contract.restaurant_name}</td>
                    <td className="p-3">{formatPrice(contract.price, contract.currency)}</td>
                    <td className="p-3">{formatPrice(contract.setup_cost, contract.currency)}</td>
                    <td className="p-3">{discountLabel(contract)}</td>
                    <td className="p-3">{formatPrice(profit, contract.currency)}</td>
                    <td className="p-3">
                      {contract.next_renewal_on ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{formatDate(contract.next_renewal_on)}</span>
                          {contract.next_renewal_on <= todayIso() ? (
                            <Badge variant="outline">منتهٍ</Badge>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={paid === dues.length && dues.length > 0 ? "success" : "outline"}>
                        {paid}/{dues.length || contract.installments_count}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => setPayments(contract)}>
                          الدفعات
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(contract);
                            setForm(billingFormFromContract(contract, plans));
                          }}
                        >
                          تعديل
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleting(contract)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="عقد مالي"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>إلغاء</Button>
            <Button loading={saving} disabled={!restaurantId} onClick={() => void save(restaurantId)}>حفظ</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="المحل" htmlFor="finance-restaurant" required>
            <Select
              id="finance-restaurant"
              value={restaurantId}
              onChange={setRestaurantId}
              options={available.map((restaurant) => ({ value: restaurant.id, label: restaurant.name }))}
              placeholder="اختر محلاً"
            />
          </FormField>
          <MenuBillingFields
            plans={plans}
            value={form}
            onChange={setForm}
            disabled={saving}
            posMode={posOptions(restaurantId).mode}
            posPricing={posPricing}
          />
        </div>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="تعديل العقد"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button loading={saving} disabled={!editing} onClick={() => editing && void save(editing.restaurant_id)}>
              حفظ
            </Button>
          </>
        }
      >
        <MenuBillingFields
          plans={plans}
          value={form}
          onChange={setForm}
          disabled={saving}
          posMode={posOptions(editing?.restaurant_id ?? "").mode}
          posPricing={posPricing}
        />
      </Dialog>

      <Dialog
        open={Boolean(payments)}
        onOpenChange={(open) => {
          if (!open) setPayments(null);
        }}
        title={payments ? `دفعات ${payments.restaurant_name}` : "الدفعات"}
        size="lg"
      >
        <div className="grid gap-2">
          {(payments?.installments ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 px-3 py-2">
              <div>
                <p className="text-sm font-medium">
                  {item.kind === "RENEWAL" ? `تجديد سنوي ${item.sequence}` : `قسط ${item.sequence}`}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatPrice(item.amount, payments?.currency)} · {formatDate(item.due_on)}
                </p>
              </div>
              <Button
                size="sm"
                variant={item.status === "PAID" ? "outline" : "primary"}
                onClick={async () => {
                  const result = await setInstallmentPaid(item.id, item.status !== "PAID");
                  if (result.error) toast({ title: result.error, variant: "error" });
                  else {
                    setPayments(null);
                    reloadPage();
                  }
                }}
              >
                {item.status === "PAID" ? "إلغاء التحصيل" : "تسجيل الدفع"}
              </Button>
            </div>
          ))}
          {payments && payments.installments.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد دفعات.</p>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف العقد المالي؟"
        description="تُحذف الأقساط والتجديدات المرتبطة. المنيو نفسه يبقى."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteMenuBilling(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            toast({ title: "تم حذف العقد", variant: "success" });
            reloadPage();
          }
        }}
      />
    </div>
  );
}

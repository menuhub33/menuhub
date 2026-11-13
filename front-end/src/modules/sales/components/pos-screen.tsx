"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { cn } from "@/core/lib/cn";
import { formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { ContentImage } from "@/core/ui/content-image";
import { CartIcon, ImageIcon, SearchIcon } from "@/core/ui/icons";
import { Input } from "@/core/ui/input";
import { useToast } from "@/core/ui/toast";
import { createSale, fetchReceipt, loadCatalog } from "@/modules/sales/actions/sales";
import { EMPTY_FORM, PosCart, type OrderForm } from "@/modules/sales/components/pos-cart";
import { PaymentDialog } from "@/modules/sales/components/payment-dialog";
import { ReceiptDialog } from "@/modules/sales/components/receipt-dialog";
import { UnpaidOrders } from "@/modules/sales/components/unpaid-orders";
import { useIncomingOrders } from "@/modules/orders/lib/use-incoming-orders";
import { CustomerOrders } from "@/modules/sales/components/customer-orders";
import type { BusinessType } from "@/modules/tenancy/types";
import { cartReducer, cartTotals, parseAmount } from "@/modules/sales/lib/cart";
import type {
  Catalog,
  CatalogCategory,
  CatalogProduct,
  PaymentMethod,
  Receipt,
  SaleInput,
} from "@/modules/sales/types";

const UNSELLABLE: Record<string, string> = {
  NO_PRICE: "بلا سعر",
  CURRENCY: "عملة مختلفة",
  OUT_OF_STOCK: "نفد",
};

export function PosScreen({
  mode,
  restaurantName,
  currency,
  userName,
  canDiscount,
  canCollect,
  canViewSales,
  canViewOrders = false,
  canManageOrders = false,
  canViewKitchen = false,
  businessType = "RESTAURANT",
  dashboardHref,
  initialCatalog,
}: {
  mode: "pos" | "waiter";
  restaurantName: string;
  currency: string;
  userName: string;
  canDiscount: boolean;
  canCollect: boolean;
  canViewSales: boolean;
  /** Customer (QR menu) orders inbox inside the screen. */
  canViewOrders?: boolean;
  canManageOrders?: boolean;
  /** Shows a link to the kitchen display (`/kitchen`). */
  canViewKitchen?: boolean;
  businessType?: BusinessType;
  /** Link back to the dashboard; null when the role has no dashboard access. */
  dashboardHref: string | null;
  initialCatalog: Catalog;
}) {
  const { toast } = useToast();
  const incoming = useIncomingOrders(canViewOrders);

  const [tab, setTab] = useState<"sell" | "unpaid" | "orders">("sell");
  const [lines, dispatch] = useReducer(cartReducer, []);
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const [categories] = useState<CatalogCategory[]>(initialCatalog.categories);
  const [products, setProducts] = useState<CatalogProduct[]>(initialCatalog.products);
  const [page, setPage] = useState(initialCatalog.currentPage);
  const [lastPage, setLastPage] = useState(initialCatalog.lastPage);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const requestId = useRef(0);
  const firstRun = useRef(true);
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const discount = useMemo(() => {
    const value = parseAmount(form.discountValue);
    return canDiscount && Number.isFinite(value) && value > 0 ? { type: form.discountType, value } : null;
  }, [canDiscount, form.discountType, form.discountValue]);
  const totals = useMemo(() => cartTotals(lines, discount), [lines, discount]);

  const inCart = useMemo(() => new Map(lines.map((line) => [line.productId, line.quantity])), [lines]);

  const fetchProducts = useCallback(
    async (nextPage: number, append: boolean) => {
      const id = ++requestId.current;
      setLoadingProducts(true);
      const result = await loadCatalog({ q: query, categoryId, page: nextPage });
      if (id !== requestId.current) return; // a newer request superseded this one
      setLoadingProducts(false);
      if (result.error || !result.data) {
        toast({ title: result.error ?? "تعذّر تحميل المنتجات", variant: "error" });
        return;
      }
      setProducts((current) => (append ? [...current, ...result.data.products] : result.data.products));
      setPage(result.data.currentPage);
      setLastPage(result.data.lastPage);
    },
    [query, categoryId, toast]
  );

  // Re-query when the search text / category changes (debounced; skipped on first render).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = window.setTimeout(() => void fetchProducts(1, false), 250);
    return () => window.clearTimeout(timer);
  }, [fetchProducts]);

  function patchForm(patch: Partial<OrderForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function validate(): boolean {
    if (lines.length === 0) return false;
    if (form.orderType === "DINE_IN" && !form.table.trim()) {
      toast({ title: "أدخل رقم الطاولة", variant: "warning" });
      return false;
    }
    if (form.orderType === "DELIVERY" && !form.address.trim()) {
      toast({ title: "أدخل عنوان التوصيل", variant: "warning" });
      return false;
    }
    if (form.discountValue.trim() !== "" && canDiscount && !discount) {
      toast({ title: "قيمة الخصم غير صحيحة", variant: "warning" });
      return false;
    }
    return true;
  }

  function checkout() {
    if (!validate()) return;
    if (mode === "waiter" || !canCollect) {
      void submit(undefined);
    } else {
      setPayOpen(true);
    }
  }

  async function submit(payment: { method: PaymentMethod; tendered: number | undefined } | undefined) {
    const channel: SaleInput["channel"] = mode === "waiter" || !canCollect ? "STAFF" : form.source;
    const input: SaleInput = {
      channel,
      order_type: form.orderType,
      table_number: form.orderType === "DINE_IN" ? form.table.trim() : undefined,
      address: form.orderType === "DELIVERY" ? form.address.trim() : undefined,
      notes: form.notes.trim() || undefined,
      items: lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
        note: line.note.trim() || undefined,
      })),
      discount: discount ? { type: discount.type, value: discount.value } : undefined,
      payment: payment
        ? {
            method: payment.method,
            tendered_amount: payment.method === "CASH" ? payment.tendered : undefined,
          }
        : undefined,
    };

    // An identical retry (e.g. after a dropped response) reuses the key: the API replays instead of duplicating.
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }

    setBusy(true);
    const result = await createSale(input, attempt.current.key);
    if (result.error || !result.data) {
      setBusy(false);
      toast({ title: result.error ?? "تعذّر تسجيل الطلب", variant: "error" });
      return;
    }

    attempt.current = null;
    const sale = result.data;
    dispatch({ type: "clear" });
    setForm(EMPTY_FORM);
    setPayOpen(false);
    setCartOpen(false);
    void fetchProducts(1, false); // stock levels changed

    if (canViewSales && payment) {
      const detail = await fetchReceipt(sale.id);
      setBusy(false);
      if (detail.data) {
        setReceipt(detail.data);
        return;
      }
    }
    setBusy(false);
    toast({
      title: `تم تسجيل الطلب ${sale.number}`,
      description: payment ? undefined : "بانتظار التحصيل عند الكاشير",
      variant: "success",
    });
  }

  async function showReceipt(saleId: string) {
    const detail = await fetchReceipt(saleId);
    if (detail.error || !detail.data) {
      toast({ title: detail.error ?? "تعذّر تحميل الفاتورة", variant: "error" });
      return;
    }
    setReceipt(detail.data);
  }

  const tabs: { id: "sell" | "unpaid" | "orders"; label: string }[] = [
    { id: "sell", label: "البيع" },
    ...(mode === "pos" && canCollect ? [{ id: "unpaid" as const, label: "بانتظار التحصيل" }] : []),
    ...(canViewOrders ? [{ id: "orders" as const, label: "طلبات الزبائن" }] : []),
  ];

  const cartPanel = (
    <PosCart
      lines={lines}
      dispatch={dispatch}
      form={form}
      onFormChange={patchForm}
      totals={totals}
      currency={currency}
      busy={busy && !payOpen}
      mode={mode === "waiter" || !canCollect ? "waiter" : "pos"}
      canDiscount={canDiscount}
      onCheckout={checkout}
    />
  );

  return (
    <div className="flex h-full flex-col bg-zinc-50">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{restaurantName}</p>
            <p className="text-xs text-zinc-500">
              {mode === "waiter" ? "شاشة النادل" : "نقطة البيع"} · {userName}
            </p>
          </div>
        </div>

        {tabs.length > 1 ? (
          <div className="flex rounded-xl bg-zinc-100 p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-9 rounded-lg px-4 text-sm font-medium transition",
                  tab === item.id ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
                )}
              >
                {item.label}
                {item.id === "orders" && incoming.pending > 0 ? (
                  <span className="ms-2 inline-block min-w-5 rounded-full bg-red-600 px-1.5 text-center text-xs font-bold leading-5 text-white">
                    {incoming.pending > 99 ? "99+" : incoming.pending}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex shrink-0 items-center gap-4">
          {canViewKitchen ? (
            <Link href="/kitchen" className="text-sm font-medium text-teal-700 hover:underline">
              المطبخ
            </Link>
          ) : null}
          {dashboardHref ? (
            <Link href={dashboardHref} className="text-sm font-medium text-teal-700 hover:underline">
              لوحة التحكم
            </Link>
          ) : null}
        </div>
      </header>

      {tab === "orders" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CustomerOrders
            canManage={canManageOrders}
            businessType={businessType}
            refreshKey={incoming.version}
            onDecided={() => incoming.adjust(-1)}
          />
        </div>
      ) : tab === "unpaid" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <UnpaidOrders onPaid={(id) => void showReceipt(id)} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_24rem]">
          <section className="flex min-h-0 flex-col">
            <div className="grid gap-3 border-b border-zinc-200 bg-white p-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث عن منتج"
                  className="ps-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <CategoryChip active={categoryId === undefined} onClick={() => setCategoryId(undefined)}>
                  الكل
                </CategoryChip>
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    active={categoryId === category.id}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name_ar}
                  </CategoryChip>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
              {products.length === 0 && !loadingProducts ? (
                <p className="py-20 text-center text-sm text-zinc-500">لا توجد منتجات مطابقة.</p>
              ) : (
                <div
                  className={cn(
                    "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
                    loadingProducts && "opacity-60"
                  )}
                >
                  {products.map((product) => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      quantity={inCart.get(product.id) ?? 0}
                      currency={currency}
                      onAdd={() => dispatch({ type: "add", product })}
                    />
                  ))}
                </div>
              )}
              {page < lastPage ? (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" loading={loadingProducts} onClick={() => void fetchProducts(page + 1, true)}>
                    عرض المزيد
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <aside className="hidden min-h-0 border-s border-zinc-200 lg:block">{cartPanel}</aside>

          {/* Narrow screens: summary bar + full-screen cart. */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white p-3 lg:hidden">
            <Button size="lg" className="w-full justify-between" onClick={() => setCartOpen(true)}>
              <span className="flex items-center gap-2">
                <CartIcon className="size-5" />
                عرض الطلب ({totals.count})
              </span>
              <span dir="ltr">{formatPrice(totals.total, currency)}</span>
            </Button>
          </div>
          {cartOpen ? (
            <div className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
              <div className="flex justify-end border-b border-zinc-100 p-2">
                <Button variant="ghost" size="sm" onClick={() => setCartOpen(false)}>
                  رجوع إلى المنتجات
                </Button>
              </div>
              <div className="min-h-0 flex-1">{cartPanel}</div>
            </div>
          ) : null}
        </div>
      )}

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="الدفع"
        total={totals.total}
        currency={currency}
        busy={busy}
        onConfirm={(method, tendered) => void submit({ method, tendered })}
        skipLabel={form.source === "EXTERNAL" ? "تسجيل بدون دفع" : undefined}
        onSkip={form.source === "EXTERNAL" ? () => void submit(undefined) : undefined}
      />

      <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition",
        active ? "bg-teal-700 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      )}
    >
      {children}
    </button>
  );
}

function ProductTile({
  product,
  quantity,
  currency,
  onAdd,
}: {
  product: CatalogProduct;
  quantity: number;
  currency: string;
  onAdd: () => void;
}) {
  const blocked = !product.sellable;
  const atLimit = product.stock_quantity != null && quantity >= product.stock_quantity;

  return (
    <button
      type="button"
      disabled={blocked || atLimit}
      onClick={onAdd}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-white text-start transition active:scale-[0.98]",
        blocked || atLimit
          ? "cursor-not-allowed border-zinc-200 opacity-50"
          : "border-zinc-200 hover:border-teal-600 hover:shadow-md",
        quantity > 0 && "border-teal-600 ring-2 ring-teal-600/20"
      )}
    >
      <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100">
        {product.image_url ? (
          <ContentImage
            src={product.image_url}
            alt={product.name_ar}
            sizes="(min-width: 1280px) 15vw, 30vw"
            className="size-full object-cover"
          />
        ) : (
          <ImageIcon className="size-8 text-zinc-300" />
        )}
      </div>
      <div className="grid gap-0.5 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-semibold text-zinc-900">{product.name_ar}</p>
        <p className="text-sm font-bold text-teal-800" dir="ltr">
          {product.price == null ? "—" : formatPrice(product.price, currency)}
        </p>
        {product.stock_quantity != null && product.sellable ? (
          <p className="text-xs text-zinc-500">المخزون: {product.stock_quantity}</p>
        ) : null}
      </div>
      {quantity > 0 ? (
        <span className="absolute end-2 top-2 flex size-7 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
          {quantity}
        </span>
      ) : null}
      {blocked && product.unsellable_reason ? (
        <span className="absolute start-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
          {UNSELLABLE[product.unsellable_reason] ?? "غير متاح"}
        </span>
      ) : null}
    </button>
  );
}

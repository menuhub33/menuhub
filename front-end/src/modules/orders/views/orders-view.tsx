"use client";

import Link from "next/link";
import { reloadPage } from "@/core/lib/reload";
import { useState } from "react";
import { PageHeader } from "@/core/components/layout/page-header";
import { EmptyState } from "@/core/components/common/empty-state";
import { formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/cn";
import { Button } from "@/core/ui/button";
import { Card } from "@/core/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { confirmOrder, rejectOrder } from "@/modules/orders/actions/orders";
import type { OrderStatus, ShopOrder } from "@/modules/orders/types";
import { normalizeBusinessType, orderTypeCopy } from "@/modules/tenancy/lib/business-type";
import type { BusinessType } from "@/modules/tenancy/types";
import { useToast } from "@/core/ui/toast";

const FILTERS: { id: OrderStatus; label: string }[] = [
  { id: "PENDING", label: "بانتظار التأكيد" },
  { id: "CONFIRMED", label: "مؤكدة" },
  { id: "REJECTED", label: "مرفوضة" },
];

const EMPTY: Record<OrderStatus, { title: string; description: string }> = {
  PENDING: {
    title: "لا توجد طلبات بانتظار التأكيد",
    description: "عندما يرسل زبون طلباً من المنيو يظهر هنا بانتظار التأكيد.",
  },
  CONFIRMED: {
    title: "لا توجد طلبات مؤكدة",
    description: "الطلبات المؤكدة تظهر هنا فقط بعد فتح هذا القسم.",
  },
  REJECTED: {
    title: "لا توجد طلبات مرفوضة",
    description: "الطلبات المرفوضة تظهر هنا فقط بعد فتح هذا القسم.",
  },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "بانتظار التأكيد",
  CONFIRMED: "مؤكد",
  REJECTED: "مرفوض",
};

export function OrdersView({
  orders,
  status,
  canManage,
  businessType,
}: {
  orders: ShopOrder[];
  status: OrderStatus;
  canManage: boolean;
  businessType: BusinessType;
}) {
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const copy = orderTypeCopy(normalizeBusinessType(businessType));

  async function run(id: string, action: "confirm" | "reject") {
    setPendingId(id);
    const result = action === "confirm" ? await confirmOrder(id) : await rejectOrder(id);
    setPendingId(null);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({
      title: action === "confirm" ? "تم تأكيد الطلب وخصم الكميات" : "تم رفض الطلب",
      variant: "success",
    });
    reloadPage();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الطلبات"
        description="تصل الطلبات عند إرسال الزبون طلبه."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الطلبات" }]}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const href = filter.id === "PENDING" ? "/dashboard/orders" : `/dashboard/orders?status=${filter.id}`;
          const active = status === filter.id;
          return (
            <Link
              key={filter.id}
              href={href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-teal-700 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Card>
          <EmptyState title={EMPTY[status].title} description={EMPTY[status].description} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table className="min-w-[64rem]">
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الأصناف</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>المجموع</TableHead>
                <TableHead>الحالة</TableHead>
                {canManage ? <TableHead>إجراءات</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const when = new Intl.DateTimeFormat("ar", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.created_at));
                const type =
                  order.delivery_type === "delivery"
                    ? copy.delivery
                    : order.delivery_type === "dine_in"
                      ? (copy.dineIn ?? "تناول في المكان")
                      : copy.pickup;
                const busy = pendingId === order.id;
                const maps =
                  order.latitude != null && order.longitude != null
                    ? `https://maps.google.com/?q=${order.latitude},${order.longitude}`
                    : null;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-semibold text-zinc-900" dir="ltr">
                        {order.number}
                      </p>
                      {order.branch_name ? (
                        <p className="mt-0.5 text-xs text-zinc-500">{order.branch_name}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-600">{when}</TableCell>
                    <TableCell>{type}</TableCell>
                    <TableCell>
                      <ul className="grid gap-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-4">
                            <span>
                              {item.quantity} × {item.name_ar}
                            </span>
                            <span className="shrink-0 text-zinc-500">
                              {item.line_total == null
                                ? "بدون سعر"
                                : formatPrice(item.line_total, order.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="max-w-56 text-zinc-600">
                      {order.table_number ? (
                        <p>
                          {copy.tableLabel}: {order.table_number}
                        </p>
                      ) : null}
                      {order.address ? <p>{order.address}</p> : null}
                      {maps ? (
                        <a href={maps} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                          موقع الزبون
                        </a>
                      ) : null}
                      {!order.table_number && !order.address && !maps ? "—" : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-zinc-900">
                      {formatPrice(order.total, order.currency)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          order.status === "PENDING" && "bg-amber-100 text-amber-800",
                          order.status === "CONFIRMED" && "bg-emerald-100 text-emerald-800",
                          order.status === "REJECTED" && "bg-zinc-100 text-zinc-600"
                        )}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        {order.status === "PENDING" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              loading={busy}
                              disabled={pendingId != null}
                              onClick={() => void run(order.id, "confirm")}
                            >
                              تأكيد
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pendingId != null}
                              onClick={() => void run(order.id, "reject")}
                            >
                              رفض
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

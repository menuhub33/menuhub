"use server";

import { apiData, apiPage, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import type { ActionResult } from "@/core/api/result";
import type { Page } from "@/core/api/client";
import type { OrderStatus, PlacePublicOrderInput, ProductComplaint, ShopOrder } from "@/modules/orders/types";

export async function listOrders(status: OrderStatus = "PENDING"): Promise<ActionResult<Page<ShopOrder>>> {
  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiPage<ShopOrder>(`/restaurants/${restaurantId}/orders`, {
      query: { status, per_page: 50 },
    });
  });
}

export async function listRestaurantComplaints(): Promise<ActionResult<ProductComplaint[]>> {
  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ProductComplaint[]>(`/restaurants/${restaurantId}/complaints`);
  });
}

export async function confirmOrder(id: string): Promise<ActionResult<ShopOrder>> {
  if (!id) return { data: null, error: "معرّف الطلب مطلوب" };
  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ShopOrder>(`/restaurants/${restaurantId}/orders/${id}/confirm`, {
      method: "POST",
    });
  });
}

export async function rejectOrder(id: string): Promise<ActionResult<ShopOrder>> {
  if (!id) return { data: null, error: "معرّف الطلب مطلوب" };
  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ShopOrder>(`/restaurants/${restaurantId}/orders/${id}/reject`, {
      method: "POST",
    });
  });
}

export async function placePublicOrder(
  slug: string,
  input: PlacePublicOrderInput
): Promise<ActionResult<Pick<ShopOrder, "id" | "number">>> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return { data: null, error: "المطعم غير محدد" };
  if (input.items.length === 0) return { data: null, error: "السلة فارغة." };
  return run(() =>
    apiData<Pick<ShopOrder, "id" | "number">>(`/public/menus/${encodeURIComponent(normalized)}/orders`, {
      method: "POST",
      auth: false,
      body: input,
    })
  );
}

export type PublicComplaint = {
  id: string;
  product_name: string;
  description: string;
};

export async function reportProductComplaint(input: {
  slug: string;
  productName: string;
  description: string;
}): Promise<ActionResult<PublicComplaint>> {
  const slug = input.slug.trim().toLowerCase();
  const productName = input.productName.trim();
  const description = input.description.trim();
  if (!slug) return { data: null, error: "المطعم غير محدد" };
  if (!productName || !description) return { data: null, error: "اكتب اسم المنتج وشرح المشكلة" };
  return run(() =>
    apiData<PublicComplaint>(`/public/menus/${encodeURIComponent(slug)}/complaints`, {
      method: "POST",
      auth: false,
      body: {
        product_name: productName,
        description,
      },
    })
  );
}

export type AdminOrderComplaint = ProductComplaint & {
  restaurant: { id: string; name: string; slug: string };
};

export async function listAdminOrderComplaints(): Promise<ActionResult<AdminOrderComplaint[]>> {
  return run(() => apiData<AdminOrderComplaint[]>("/admin/order-complaints"));
}

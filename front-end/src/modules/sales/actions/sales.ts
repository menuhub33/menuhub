"use server";

import { apiData, apiRaw, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import type { ActionResult } from "@/core/api/result";
import type {
  Catalog,
  CatalogCategory,
  CatalogProduct,
  CollectInput,
  Receipt,
  Sale,
  SaleInput,
} from "@/modules/sales/types";

async function base() {
  return `/restaurants/${await requireTenantId()}/sales`;
}

/** Products the till can sell, with an optional text / category filter. */
export async function loadCatalog(params: {
  q?: string;
  categoryId?: string;
  page?: number;
}): Promise<ActionResult<Catalog>> {
  return run(async () => {
    const payload = await apiRaw<{
      data: { categories: CatalogCategory[]; products: CatalogProduct[] };
      meta?: { current_page?: number; last_page?: number };
    }>(`${await base()}/catalog`, {
      query: {
        q: params.q?.trim() || undefined,
        category_id: params.categoryId,
        page: params.page ?? 1,
        per_page: 60,
      },
    });

    return {
      categories: payload.data?.categories ?? [],
      products: payload.data?.products ?? [],
      currentPage: payload.meta?.current_page ?? 1,
      lastPage: payload.meta?.last_page ?? 1,
    };
  });
}

/** Creates a sale. The same `idempotencyKey` is reused on every retry of one attempt. */
export async function createSale(input: SaleInput, idempotencyKey: string): Promise<ActionResult<Sale>> {
  return run(async () =>
    apiData<Sale>(`${await base()}/orders`, {
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    })
  );
}

export async function fetchReceipt(saleId: string): Promise<ActionResult<Receipt>> {
  return run(async () => apiData<Receipt>(`${await base()}/orders/${saleId}/receipt`));
}

/** Confirmed sales that still have a balance (waiter orders waiting for the cashier). */
export async function listUnpaidSales(): Promise<ActionResult<Sale[]>> {
  return run(async () => {
    const payload = await apiRaw<{ data?: Sale[] }>(`${await base()}/orders/unpaid`, {
      query: { per_page: 50 },
    });
    return payload.data ?? [];
  });
}

export async function collectPayment(
  saleId: string,
  input: CollectInput,
  idempotencyKey: string
): Promise<ActionResult<Sale>> {
  return run(async () =>
    apiData<Sale>(`${await base()}/orders/${saleId}/payments`, {
      method: "POST",
      body: input,
      headers: { "Idempotency-Key": idempotencyKey },
    })
  );
}

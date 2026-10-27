import { getToken } from "@/core/auth/token";
import { fail, ok, type ActionResult } from "@/core/api/result";

/**
 * Server-side HTTP client for the Laravel API (`back-end`, prefix `/api/v1`).
 *
 * It only runs on the server: the bearer token lives in an httpOnly cookie and
 * is attached here, so the browser never sees it. Client components talk to
 * the API through Server Actions or the `/api/upload` route handler.
 */
import { API_URL } from "@/core/api/config";

type Primitive = string | number | boolean | null | undefined;

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, Primitive>;
  body?: unknown;
  formData?: FormData;
  /** Send the session token (default). Public endpoints pass `false`. */
  auth?: boolean;
  /** Seconds to cache a GET in the Next data cache. Default: no caching. */
  revalidate?: number;
  tags?: string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK: Record<number, string> = {
  401: "يجب تسجيل الدخول أولاً",
  403: "غير مصرح لك بهذا الإجراء",
  404: "العنصر غير موجود",
  419: "انتهت الجلسة. أعد المحاولة",
  429: "محاولات كثيرة، حاول بعد قليل",
  500: "حدث خطأ في الخادم. حاول مرة أخرى",
};

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

function errorMessage(status: number, payload: unknown) {
  const body = (payload ?? {}) as { message?: string; errors?: Record<string, string[]> };
  const first = body.errors ? Object.values(body.errors).flat()[0] : undefined;
  return first || body.message || FALLBACK[status] || "تعذر تنفيذ الطلب";
}

async function send(path: string, options: ApiOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "ar",
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body,
      ...(options.revalidate !== undefined && method === "GET"
        ? { next: { revalidate: options.revalidate, tags: options.tags } }
        : { cache: "no-store" as const }),
    });
  } catch {
    throw new ApiError("تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى", 503, "NETWORK");
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const info = (payload ?? {}) as { code?: string; errors?: Record<string, string[]> };
    throw new ApiError(errorMessage(response.status, payload), response.status, info.code, info.errors);
  }

  return payload;
}

/** Whole JSON body. */
export async function apiRaw<T = unknown>(path: string, options?: ApiOptions): Promise<T> {
  return (await send(path, options)) as T;
}

/** The `data` member of the response envelope. */
export async function apiData<T>(path: string, options?: ApiOptions): Promise<T> {
  const payload = (await send(path, options)) as { data?: T } | null;
  return (payload?.data ?? null) as T;
}

export type Page<T> = {
  items: T[];
  currentPage: number;
  lastPage: number;
  total: number;
};

/** One page of a Laravel paginator (resource collections and raw paginators). */
export async function apiPage<T>(path: string, options?: ApiOptions): Promise<Page<T>> {
  const payload = (await send(path, options)) as {
    data?: T[];
    meta?: { current_page?: number; last_page?: number; total?: number };
    current_page?: number;
    last_page?: number;
    total?: number;
  };
  const meta = payload.meta ?? payload;
  const items = payload.data ?? [];
  return {
    items,
    currentPage: meta.current_page ?? 1,
    lastPage: meta.last_page ?? 1,
    total: meta.total ?? items.length,
  };
}

/** Reads every page (100 per page, at most 20 pages) into a single list. */
export async function apiAll<T>(path: string, options: ApiOptions = {}): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await apiPage<T>(path, {
      ...options,
      query: { ...options.query, per_page: 100, page },
    });
    items.push(...result.items);
    if (page >= result.lastPage) break;
  }
  return items;
}

/** Runs an API call and converts the outcome to an `ActionResult`. */
export async function run<T>(task: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await task());
  } catch (error) {
    if (error instanceof ApiError) return fail(error.message);
    throw error;
  }
}

"use server";

import { cache } from "react";
import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { PublicMenuData } from "@/modules/storefront/types";

export type PublicMenuState =
  | { kind: "live"; data: PublicMenuData }
  | {
      kind: "unavailable";
      reason: "NOT_FOUND" | "DRAFT" | "UNPUBLISHED" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
      name?: string;
      logo_url?: string | null;
    };

// `generateMetadata` and the page body both need the menu; without this cache
// the menu would be requested twice per render. (The API caches it as well.)
const loadPublicMenu = cache(
  async (slug: string): Promise<ActionResult<PublicMenuState>> =>
    run(() =>
      apiData<PublicMenuState>(`/public/menus/${encodeURIComponent(slug)}`, { auth: false })
    )
);

/** State of a public menu: `live` with the whole tree, or `unavailable` with a reason. */
export async function getPublicMenu(
  slug: string
): Promise<ActionResult<PublicMenuState>> {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");
  return loadPublicMenu(normalized);
}

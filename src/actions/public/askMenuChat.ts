"use server";

import { getPublicMenu } from "@/actions/public/getPublicMenu";
import { fail, ok, type ActionResult } from "@/lib/action";
import {
  completeMenuChat,
  formatBusinessHours,
  isMenuChatbotEnabled,
  menuChatbotName,
  menuChatbotWelcome,
  type MenuChatCatalog,
  type MenuChatMessage,
  type MenuChatProduct,
  type MenuChatReply,
} from "@/lib/menu-chat";
import { DEMO_BUSINESS_HOURS, DEMO_MENU_SLUG, getDemoPublicMenu } from "@/lib/demo-menu";
import { createClient } from "@/lib/supabase/server";
import { productPrimaryImageUrl } from "@/components/public-menu/product-image";

const MAX_MESSAGES = 12;
const MAX_CONTENT = 500;
const hits = new Map<string, number[]>();

export type AskMenuChatInput = {
  slug: string;
  messages: MenuChatMessage[];
};

function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function sanitizeMessages(input: MenuChatMessage[]): MenuChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const cleaned: MenuChatMessage[] = [];
  for (const message of input.slice(-MAX_MESSAGES)) {
    if (message.role !== "user" && message.role !== "assistant") return null;
    const content = typeof message.content === "string" ? message.content.trim() : "";
    if (!content || content.length > MAX_CONTENT) return null;
    cleaned.push({ role: message.role, content });
  }
  if (!cleaned.some((message) => message.role === "user")) return null;
  return cleaned;
}

export async function askMenuChat(
  input: AskMenuChatInput
): Promise<ActionResult<MenuChatReply>> {
  const slug = input.slug?.trim().toLowerCase();
  if (!slug) return fail("معرّف المنيو مطلوب");

  const messages = sanitizeMessages(input.messages);
  if (!messages) return fail("الرسالة غير صالحة");

  if (!rateLimit(slug)) {
    return fail("وصلت للحد الأقصى من الأسئلة، حاول بعد قليل");
  }

  const result = await getPublicMenu(slug);
  if (result.error || !result.data) return fail(result.error ?? "تعذر تحميل المنيو");
  if (result.data.kind !== "live") return fail("المنيو غير متاح حالياً");

  let data = result.data.data;
  if (slug === DEMO_MENU_SLUG) {
    const count = data.categories.reduce(
      (sum, category) => sum + (category.products?.length ?? 0),
      0
    );
    if (count === 0) data = getDemoPublicMenu();
  }
  if (!isMenuChatbotEnabled(data.restaurant)) {
    return fail("مساعد المنيو غير مفعّل");
  }

  const supabase = await createClient();
  const { data: hourRows } = await supabase
    .from("business_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("restaurant_id", data.restaurant.id)
    .is("branch_id", null)
    .order("day_of_week");
  let hours = (hourRows ?? []) as typeof DEMO_BUSINESS_HOURS;
  if (slug === DEMO_MENU_SLUG && hours.length === 0) {
    hours = DEMO_BUSINESS_HOURS;
  }

  const products: MenuChatProduct[] = [];
  const categories: string[] = [];

  for (const category of [...data.categories]
    .filter((item) => item.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)) {
    categories.push(category.name_ar);
    for (const product of [...(category.products ?? [])]
      .filter((item) => item.status !== "HIDDEN")
      .sort((a, b) => a.sort_order - b.sort_order)) {
      products.push({
        id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        description_ar: product.description_ar,
        description_en: product.description_en,
        price: product.price,
        currency: product.currency,
        status: product.status,
        is_featured: product.is_featured,
        old_price: product.old_price,
        image_url: productPrimaryImageUrl(product),
        category: category.name_ar,
        extras: (product.option_groups ?? []).flatMap((group) =>
          (group.options ?? [])
            .filter((option) => option.is_active !== false)
            .map((option) => option.name_ar)
        ),
      });
    }
  }

  const catalog: MenuChatCatalog = {
    restaurantName: data.restaurant.name,
    description: data.restaurant.description,
    deliveryEnabled: data.restaurant.delivery_enabled !== false,
    businessType: data.restaurant.business_type ?? "RESTAURANT",
    address: data.restaurant.address,
    phone: data.restaurant.phone,
    whatsapp: data.restaurant.whatsapp,
    timezone: data.restaurant.timezone || "Asia/Damascus",
    chatbotName: menuChatbotName(data.restaurant),
    welcome: menuChatbotWelcome(data.restaurant),
    hours: formatBusinessHours(hours ?? []),
    products,
    categories,
    branches: (data.branches ?? []).map((branch) => ({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
    })),
  };

  try {
    const reply = await completeMenuChat(catalog, messages);
    return ok(reply);
  } catch {
    return fail("تعذر الرد حالياً، حاول مرة أخرى.");
  }
}

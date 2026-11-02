import type { ProductStatus } from "@/modules/catalog/types";
import type { Restaurant } from "@/modules/tenancy/types";

/**
 * Shapes returned by `POST /public/menus/{slug}/chat`. The answering logic
 * (catalogue search, optional LLM call) lives in `back-end/modules/Chatbot`.
 */
export type MenuChatProduct = {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  currency: string;
  status: ProductStatus;
  is_featured: boolean;
  old_price: number | null;
  image_url: string | null;
  category: string;
  extras: string[];
};

export type MenuChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MenuChatContact = {
  phone: string | null;
  whatsapp: string | null;
  display: string;
};

export type MenuChatReply = {
  reply: string;
  products: MenuChatProduct[];
  contact?: MenuChatContact | null;
  unknown?: boolean;
  suggestions?: string[];
};

export function isMenuChatbotEnabled(restaurant: Pick<Restaurant, "chatbot_enabled">): boolean {
  return restaurant.chatbot_enabled !== false;
}

export function menuChatbotName(restaurant: Pick<Restaurant, "name" | "chatbot_name">): string {
  const custom = restaurant.chatbot_name?.trim();
  return custom || `مساعد ${restaurant.name}`;
}

export function menuChatbotWelcome(
  restaurant: Pick<Restaurant, "name" | "chatbot_welcome">
): string {
  const custom = restaurant.chatbot_welcome?.trim();
  return (
    custom ||
    `مرحباً، أنا مساعد ${restaurant.name}. اسألني عن الأصناف والأسعار والأقسام والتوصيل. إذا ما عرفت الجواب بحوّلك على رقم التواصل.`
  );
}

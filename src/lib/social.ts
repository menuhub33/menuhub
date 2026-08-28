import { toWhatsAppNumber, whatsappHref } from "@/lib/phone";

export function normalizeSocialUrl(platform: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (platform === "whatsapp") {
    const number = toWhatsAppNumber(trimmed);
    return number ? `https://wa.me/${number}` : null;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function socialHref(platform: string, url: string): string {
  if (platform === "whatsapp") return whatsappHref(url);
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

export function socialInputDisplay(platform: string, url: string): string {
  if (platform !== "whatsapp") return url;
  const fromLink = url.match(/wa\.me\/(\+?\d+)/i)?.[1];
  return fromLink ?? url;
}

export function socialInputPlaceholder(platform: string): string {
  if (platform === "whatsapp") return "09xxxxxxxx";
  if (platform === "instagram") return "https://instagram.com/";
  if (platform === "facebook") return "https://facebook.com/";
  if (platform === "tiktok") return "https://tiktok.com/@";
  if (platform === "twitter") return "https://x.com/";
  if (platform === "youtube") return "https://youtube.com/";
  if (platform === "snapchat") return "https://snapchat.com/add/";
  return "https://";
}

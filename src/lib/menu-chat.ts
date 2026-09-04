import { formatPrice, formatTime, dayNameAr } from "@/components/lib/format";
import { orderTypeCopy } from "@/lib/business-type";
import { toWhatsAppNumber } from "@/lib/phone";
import type { BusinessType, ProductStatus, Restaurant } from "@/lib/types";

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

export type MenuChatHour = {
  day: string;
  dayOfWeek: number;
  text: string;
};

export type MenuChatBranch = {
  name: string;
  address: string | null;
  phone: string | null;
};

export type MenuChatCatalog = {
  restaurantName: string;
  description: string | null;
  deliveryEnabled: boolean;
  businessType: BusinessType;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  timezone: string;
  chatbotName: string;
  welcome: string;
  hours: MenuChatHour[];
  products: MenuChatProduct[];
  categories: string[];
  branches: MenuChatBranch[];
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

const STOPWORDS = new Set([
  "في",
  "من",
  "على",
  "هل",
  "ما",
  "شو",
  "كم",
  "سعر",
  "سعره",
  "سعرها",
  "اسعار",
  "اريد",
  "بدي",
  "عندكم",
  "عندك",
  "يا",
  "ال",
  "و",
  "او",
  "هذا",
  "هذه",
  "هيدا",
  "عن",
  "لي",
  "لو",
  "سمحت",
  "ممكن",
  "فيه",
  "فيكم",
  "عند",
  "شي",
  "شيء",
  "please",
  "the",
  "a",
  "an",
  "is",
  "do",
  "you",
  "have",
]);

const SYNONYMS: Record<string, string[]> = {
  بيتزا: ["pizza"],
  برغر: ["برجر", "همبرغر", "burger"],
  برجر: ["برغر", "burger"],
  دجاج: ["فروج", "تشكن", "chicken"],
  فروج: ["دجاج", "chicken"],
  لحم: ["لحمه", "كباب", "مشاوي"],
  مشروب: ["مشروبات", "عصير", "drink", "كولا"],
  مشروبات: ["مشروب", "عصير"],
  قهوه: ["كوفي", "coffee", "اسبريسو", "لاتيه"],
  كوفي: ["قهوه", "coffee"],
  حلو: ["حلويات", "dessert", "كيك"],
  حلويات: ["حلو", "كيك"],
  ساندويش: ["ساندويتش", "شطيره"],
  ساندويتش: ["ساندويش"],
  بطاطا: ["فريز", "fries"],
  سلطه: ["سلطة", "salad"],
  سياره: ["سيارة", "سيارات", "car", "cars"],
  سيارة: ["سياره", "سيارات", "car"],
  سيارات: ["سياره", "سيارة", "car"],
  سيدان: ["sedan"],
  كهربائيه: ["كهربائية", "electric", "تسلا", "tesla"],
  كهربائية: ["كهربائيه", "electric"],
  تويوتا: ["toyota"],
  هيونداي: ["hyundai"],
  كيا: ["kia"],
  سنتافيه: ["سانتافي", "santa fe", "santafe"],
  سانتافي: ["سنتافيه", "santa fe"],
  سبورتاج: ["sportage"],
  برادو: ["prado"],
  سورنتو: ["سيرنتو", "sorento"],
  سيرنتو: ["سورنتو", "sorento"],
  توسان: ["tucson"],
  فورتشنر: ["fortuner"],
  باجيرو: ["pajero"],
  إلنترا: ["النترا", "elantra"],
  كورولا: ["corolla"],
  سيراتو: ["cerato", "forte"],
  ريو: ["rio", "تكسي", "تكاسي"],
  تكسي: ["تكاسي", "rio", "ريو"],
  تكاسي: ["تكسي", "ريو", "rio"],
  "بي ام": ["bmw", "بي ام دبليو"],
  "بي ام دبليو": ["bmw", "بي ام"],
  اودي: ["audi", "أودي"],
  أودي: ["audi", "اودي"],
  لانسر: ["lancer", "لانسر"],
  ميتسوبيشي: ["mitsubishi", "مستوبيشي", "مستابيشي"],
  مستابيشي: ["ميتسوبيشي", "mitsubishi"],
};

const DEFAULT_SUGGESTIONS = ["ما هي الأقسام؟", "أرخص الأصناف", "هل التوصيل متاح؟", "كيف أطلب؟"];

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

export function formatBusinessHours(
  rows: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
): MenuChatHour[] {
  return [...rows]
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((row) => ({
      day: dayNameAr(row.day_of_week),
      dayOfWeek: row.day_of_week,
      text: row.is_closed
        ? "مغلق"
        : `${formatTime(row.open_time)} – ${formatTime(row.close_time)}`,
    }));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOf(value: string): string[] {
  const base = normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
  const extra: string[] = [];
  for (const token of base) {
    extra.push(...(SYNONYMS[token] ?? []));
  }
  return [...new Set([...base, ...extra.map(normalize)])];
}

function looksLike(query: string, pattern: RegExp): boolean {
  return pattern.test(normalize(query));
}

function haystack(product: MenuChatProduct): string {
  return normalize(
    [
      product.name_ar,
      product.name_en,
      product.description_ar,
      product.description_en,
      product.category,
      ...product.extras,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function available(products: MenuChatProduct[]): MenuChatProduct[] {
  return products.filter((product) => product.status !== "HIDDEN");
}

function formatProductLine(product: MenuChatProduct): string {
  const status = product.status === "UNAVAILABLE" ? " — غير متوفر حالياً" : "";
  const offer =
    product.old_price != null && product.old_price > product.price
      ? ` (بدلاً من ${formatPrice(product.old_price, product.currency)})`
      : "";
  return `• ${product.name_ar} — ${formatPrice(product.price, product.currency)}${offer}${status}`;
}

function contactInfo(catalog: MenuChatCatalog): MenuChatContact | null {
  const phone = catalog.phone?.trim() || null;
  const whatsapp = catalog.whatsapp?.trim() || phone;
  const display = phone || catalog.whatsapp?.trim() || null;
  if (!display) return null;
  return { phone, whatsapp, display };
}

function contactBlock(catalog: MenuChatCatalog): string | null {
  const contact = contactInfo(catalog);
  if (!contact) return null;
  const wa = contact.whatsapp ? toWhatsAppNumber(contact.whatsapp) : null;
  if (wa) return `تواصل معنا على ${contact.display} أو واتساب.`;
  return `تواصل معنا على ${contact.display}`;
}

function unknownReply(catalog: MenuChatCatalog, topic?: string): MenuChatReply {
  const intro = topic
    ? `ما عندي معلومات كافية عن ${topic} في المنيو.`
    : "ما قدرت أجاوب على هذا السؤال من معلومات المنيو.";
  const contact = contactInfo(catalog);
  const help = contactBlock(catalog);
  return {
    reply: help
      ? `${intro}\n${help} لنساعدك مباشرة.`
      : `${intro}\nجرّب تسأل عن الأقسام أو الأسعار أو اسم صنف.`,
    products: [],
    contact,
    unknown: true,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export function searchCatalogProducts(
  catalog: MenuChatCatalog,
  query: string,
  limit = 5
): MenuChatProduct[] {
  const q = normalize(query);
  const tokens = tokensOf(query);
  if (!q) return [];

  const scored = available(catalog.products)
    .map((product) => {
      const hay = haystack(product);
      const name = normalize(product.name_ar);
      let score = 0;
      if (hay.includes(q) || name.includes(q)) score += 90;
      if (name === q) score += 40;
      for (const token of tokens) {
        if (name === token) score += 28;
        else if (name.includes(token)) score += 18;
        else if (hay.includes(token)) score += 10;
        else if (token.length >= 4 && name.split(" ").some((word) => word.startsWith(token.slice(0, 4)))) {
          score += 8;
        }
      }
      if (product.is_featured) score += 3;
      return { product, score };
    })
    .filter((row) => row.score >= 10)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  return scored.slice(0, limit).map((row) => row.product);
}

function listByCategory(catalog: MenuChatCatalog, name: string): MenuChatProduct[] {
  const q = normalize(name);
  return available(catalog.products).filter((product) => normalize(product.category).includes(q));
}

function cheapest(catalog: MenuChatCatalog, limit = 5): MenuChatProduct[] {
  return [...available(catalog.products)]
    .filter((product) => product.status === "AVAILABLE")
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

function featured(catalog: MenuChatCatalog, limit = 5): MenuChatProduct[] {
  const offers = available(catalog.products).filter(
    (product) =>
      product.is_featured || (product.old_price != null && product.old_price > product.price)
  );
  return (offers.length > 0 ? offers : cheapest(catalog, limit)).slice(0, limit);
}

function weekdayInTimezone(timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(new Date());
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? new Date().getDay();
}

function parsePriceCap(query: string): number | null {
  const q = normalize(query);
  const match = q.match(/(?:اقل من|ارخص من|تحت|اقل ب|بحد اقصى)\s*(\d{2,7})/);
  if (match?.[1]) return Number(match[1]);
  return null;
}

function isFollowUp(query: string): boolean {
  return looksLike(
    query,
    /^(وكم|والسعر|سعره|سعرها|كم سعره|كم سعرها|هذا|هيدا|الاول|الثاني|الثالث|كمان|منها|تمام|اوك|ok|نعم)$/
  );
}

export function answerFromCatalog(
  catalog: MenuChatCatalog,
  question: string,
  previousUserQuestion?: string
): MenuChatReply {
  const q = question.trim();
  if (!q) {
    return { reply: catalog.welcome, products: [], suggestions: DEFAULT_SUGGESTIONS };
  }

  const effective = isFollowUp(q) && previousUserQuestion ? previousUserQuestion : q;

  if (looksLike(q, /^(مرحبا|اهلا|السلام|هلا|hi|hello|hey|سلام)/)) {
    return {
      reply: catalog.welcome,
      products: featured(catalog, 3),
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  if (looksLike(q, /^(شكرا|شكراً|تسلم|يعطيك العافيه|thanks)/)) {
    return {
      reply: "العفو. إذا احتجت شيء ثاني عن المنيو أنا هنا.",
      products: [],
      suggestions: DEFAULT_SUGGESTIONS,
    };
  }

  if (looksLike(effective, /(ساع|دوام|مفتوح|بتفتح|بتقفل|وقت العمل|hours|اليوم)/)) {
    if (catalog.hours.length === 0) return unknownReply(catalog, "ساعات العمل");
    const today = catalog.hours.find(
      (row) => row.dayOfWeek === weekdayInTimezone(catalog.timezone || "Asia/Damascus")
    );
    const todayLine = today ? `\nاليوم (${today.day}): ${today.text}` : "";
    return {
      reply: `ساعات العمل:${todayLine}\n${catalog.hours.map((row) => `• ${row.day}: ${row.text}`).join("\n")}`,
      products: [],
    };
  }

  if (looksLike(effective, /(توصيل|دليفري|delivery|يوصل)/)) {
    const copy = orderTypeCopy(catalog.businessType);
    if (catalog.deliveryEnabled) {
      return {
        reply: `نعم، ${copy.delivery} متاح. أضف الأصناف للسلة ثم أتمم الطلب من المنيو.`,
        products: [],
      };
    }
    return {
      reply: `${copy.delivery} غير مفعّل حالياً. يمكنك ${copy.pickup} من المنيو، أو تواصل معنا للتأكيد.`,
      products: [],
      contact: contactInfo(catalog),
    };
  }

  if (looksLike(effective, /(كيف اطلب|طريقة الطلب|كيف يتم الطلب|اتم الطلب|السلة|سله)/)) {
    const copy = orderTypeCopy(catalog.businessType);
    const delivery = catalog.deliveryEnabled
      ? `${copy.delivery} أو ${copy.pickup}`
      : copy.pickup;
    const dine = copy.dineIn ? ` أو ${copy.dineIn}` : "";
    return {
      reply: `للطلب: اختر الصنف من المنيو، حدّد الكمية، ثم افتح السلة وأتمم الطلب عبر واتساب (${delivery}${dine}).`,
      products: featured(catalog, 3),
    };
  }

  if (looksLike(effective, /(استلام|تيك اواي|takeaway|pickup)/)) {
    const copy = orderTypeCopy(catalog.businessType);
    return {
      reply: `نعم، ${copy.pickup} متاح. أضف الأصناف للسلة ثم اختر الاستلام عند إتمام الطلب.`,
      products: [],
    };
  }

  if (looksLike(effective, /(طاوله|طاولة|تناول|ديني|dine)/)) {
    const copy = orderTypeCopy(catalog.businessType);
    if (!copy.dineIn) return unknownReply(catalog, "التناول في المكان");
    return {
      reply: `نعم، ${copy.dineIn} متاح. عند إتمام الطلب أدخل رقم الطاولة.`,
      products: [],
    };
  }

  if (looksLike(effective, /(عنوان|وين موقع|الموقع|location|وينكم|مكانكم)/)) {
    if (!catalog.address?.trim()) return unknownReply(catalog, "العنوان");
    return { reply: `العنوان: ${catalog.address.trim()}`, products: [] };
  }

  if (looksLike(effective, /(فرع|فروع|branches)/)) {
    if (catalog.branches.length === 0) {
      if (catalog.address?.trim()) {
        return { reply: `فرع ${catalog.restaurantName}: ${catalog.address.trim()}`, products: [] };
      }
      return unknownReply(catalog, "الفروع");
    }
    return {
      reply: `الفروع:\n${catalog.branches
        .map((branch) => {
          const bits = [branch.name, branch.address, branch.phone].filter(Boolean);
          return `• ${bits.join(" — ")}`;
        })
        .join("\n")}`,
      products: [],
    };
  }

  if (looksLike(effective, /(رقم|هاتف|واتساب|تواصل|phone|واتس|اتصال)/)) {
    const contact = contactInfo(catalog);
    if (!contact) return unknownReply(catalog, "رقم التواصل");
    return {
      reply: `رقم التواصل: ${contact.display}\nاضغط الزر بالأسفل للاتصال أو واتساب.`,
      products: [],
      contact,
    };
  }

  if (looksLike(effective, /(دفع|كاش|بطاقه|فيزا|حواله|حجز|وظائ|شكوى|كوبون|كود خصم)/)) {
    return unknownReply(catalog);
  }

  if (looksLike(effective, /(ارخص|رخيص|اقل سعر)/) || normalize(effective).includes("ارخص")) {
    const cap = parsePriceCap(effective);
    const products = cap
      ? cheapest(catalog, 12).filter((product) => product.price <= cap).slice(0, 5)
      : cheapest(catalog);
    if (products.length === 0) return unknownReply(catalog, "الأسعار");
    return {
      reply: cap
        ? `أصناف بسعر ${formatPrice(cap, products[0].currency)} أو أقل:\n${products.map(formatProductLine).join("\n")}`
        : `من الأقل سعراً:\n${products.map(formatProductLine).join("\n")}`,
      products,
    };
  }

  if (looksLike(effective, /(اغلى|اغلي|اعلى سعر)/) || normalize(effective).includes("اغلي")) {
    const products = [...available(catalog.products)]
      .filter((product) => product.status === "AVAILABLE")
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);
    if (products.length === 0) return unknownReply(catalog, "الأسعار");
    return {
      reply: `من الأعلى سعراً:\n${products.map(formatProductLine).join("\n")}`,
      products,
    };
  }

  if (looksLike(effective, /(عرض|عروض|خصم|تخفيض|featured|شائع|مميز)/)) {
    const products = featured(catalog);
    if (products.length === 0) return unknownReply(catalog, "العروض");
    return {
      reply: `العروض والأصناف المميزة:\n${products.map(formatProductLine).join("\n")}`,
      products,
    };
  }

  if (looksLike(effective, /(اقترح|نصح|توصي|شو اطلب|ماذا تنصح)/)) {
    const products = featured(catalog, 4);
    if (products.length === 0) return unknownReply(catalog, "التوصيات");
    return {
      reply: `أنصحك تجرب من المميز عند ${catalog.restaurantName}:\n${products.map(formatProductLine).join("\n")}`,
      products,
    };
  }

  if (looksLike(effective, /(اقسام|تصنيف|التصنيفات|الاقسام)/)) {
    if (catalog.categories.length === 0) return unknownReply(catalog, "الأقسام");
    return {
      reply: `الأقسام المتوفرة:\n${catalog.categories.map((name) => `• ${name}`).join("\n")}\nاسألني عن أي قسم لعرض أصنافه.`,
      products: [],
      suggestions: catalog.categories.slice(0, 4),
    };
  }

  const matchedCategory = catalog.categories.find((name) =>
    normalize(effective).includes(normalize(name))
  );
  if (matchedCategory) {
    const products = listByCategory(catalog, matchedCategory).slice(0, 8);
    if (products.length === 0) return unknownReply(catalog, `قسم ${matchedCategory}`);
    return {
      reply: `من قسم ${matchedCategory}:\n${products.map(formatProductLine).join("\n")}`,
      products,
    };
  }

  const matches = searchCatalogProducts(catalog, effective, 5);
  if (matches.length > 0) {
    const top = matches[0];
    const extras = top?.extras ?? [];
    const extrasLine =
      looksLike(effective, /(اضاف|خيار|حجم)/) && extras.length > 0
        ? `\nالإضافات المتوفرة لـ ${top.name_ar}: ${extras.join("، ")}`
        : "";
    const details = looksLike(effective, /(مكون|وصف|حساسيه|سعرات|كالوري)/)
      ? top.description_ar?.trim() || top.description_en?.trim() || null
      : null;
    if (looksLike(effective, /(مكون|حساسيه|سعرات|كالوري)/) && !details && extras.length === 0) {
      return unknownReply(catalog, `تفاصيل ${top.name_ar}`);
    }
    const detailLine = details ? `\n${details}` : "";
    return {
      reply: `هذا ما وجدته في المنيو:\n${matches.map(formatProductLine).join("\n")}${detailLine}${extrasLine}`,
      products: matches,
    };
  }

  if (looksLike(effective, /(مكون|حساسيه|سعرات|كالوري)/)) {
    return unknownReply(catalog);
  }

  if (looksLike(effective, /(المنيو|شو عندكم|ماذا لديكم|الاصناف|قائمه|قائمة)/)) {
    if (catalog.categories.length === 0) return unknownReply(catalog, "المنيو");
    return {
      reply: `أقسام ${catalog.restaurantName}: ${catalog.categories.join("، ")}.\nاسألني عن قسم أو اسم صنف.`,
      products: featured(catalog, 4),
      suggestions: catalog.categories.slice(0, 4),
    };
  }

  return unknownReply(catalog);
}

export function catalogPrompt(catalog: MenuChatCatalog): string {
  const contact = contactBlock(catalog);
  const copy = orderTypeCopy(catalog.businessType);
  const lines = [
    `أنت مساعد منيو "${catalog.restaurantName}".`,
    "أجب بالعربية باختصار وبأسلوب ودّي، ومن بيانات هذا المنيو فقط. لا تخترع أسعاراً أو أصنافاً أو أوقاتاً.",
    catalog.description ? `وصف النشاط: ${catalog.description}` : null,
    `التوصيل: ${catalog.deliveryEnabled ? `متاح (${copy.delivery})` : "غير متاح"}`,
    `الاستلام: ${copy.pickup}`,
    copy.dineIn ? `التناول في المكان: ${copy.dineIn}` : null,
    catalog.address ? `العنوان: ${catalog.address}` : null,
    catalog.phone ? `الهاتف: ${catalog.phone}` : null,
    catalog.whatsapp ? `واتساب: ${catalog.whatsapp}` : null,
    catalog.hours.length > 0
      ? `ساعات العمل:\n${catalog.hours.map((row) => `${row.day}: ${row.text}`).join("\n")}`
      : "ساعات العمل غير محددة.",
    catalog.branches.length > 0
      ? `الفروع:\n${catalog.branches.map((branch) => `${branch.name} ${branch.address ?? ""}`).join("\n")}`
      : null,
    "المنيو:",
  ].filter((line): line is string => Boolean(line));

  for (const category of catalog.categories) {
    const items = catalog.products.filter((product) => product.category === category).slice(0, 20);
    lines.push(`- ${category}:`);
    for (const product of items) {
      const status = product.status === "UNAVAILABLE" ? " غير متوفر" : "";
      const extras = product.extras.length > 0 ? ` | إضافات: ${product.extras.join("، ")}` : "";
      lines.push(`  - ${product.name_ar} | ${product.price} ${product.currency}${status}${extras}`);
    }
  }

  lines.push(
    contact
      ? `إذا لم تجد الإجابة بدقة في البيانات، لا تخمّن. قل ذلك بجملة قصيرة ثم اكتب هذا السطر حرفياً: ${contact}`
      : "إذا لم تجد الإجابة، قل ذلك بوضوح واطلب من الزبون السؤال عن الأصناف أو الأسعار."
  );
  return lines.join("\n").slice(0, 12000);
}

function looksUncertain(text: string): boolean {
  return looksLike(
    text,
    /(لا اعرف|لا اعلم|ليس لدي|لم اجد|ما عندي|ما قدرت|غير متوفر في|لا املك معلومه|لا يمكنني التاكد|لا توجد لدي معلومات)/
  );
}

function withContactIfNeeded(
  reply: string,
  catalog: MenuChatCatalog,
  products: MenuChatProduct[],
  unknown: boolean
): MenuChatReply {
  const contact = contactInfo(catalog);
  const needsContact = unknown || looksUncertain(reply);
  if (!needsContact) return { reply, products };
  const help = contactBlock(catalog);
  const hasContactAlready = help ? reply.includes(contact?.display ?? "") : true;
  return {
    reply: help && !hasContactAlready ? `${reply.trim()}\n${help} لنساعدك مباشرة.` : reply,
    products,
    contact,
    unknown: true,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export async function completeMenuChat(
  catalog: MenuChatCatalog,
  messages: MenuChatMessage[]
): Promise<MenuChatReply> {
  const users = messages.filter((message) => message.role === "user");
  const lastUser = users[users.length - 1]?.content ?? "";
  const previousUser = users[users.length - 2]?.content;
  const fallback = answerFromCatalog(catalog, lastUser, previousUser);
  const llm = await completeWithLlm(catalogPrompt(catalog), messages);
  if (!llm) return fallback;
  return withContactIfNeeded(llm, catalog, fallback.products, Boolean(fallback.unknown));
}

async function completeWithLlm(
  system: string,
  messages: MenuChatMessage[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.MENU_CHAT_API_KEY;
  if (!apiKey) return null;

  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.MENU_CHAT_MODEL ?? "gpt-4o-mini";

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 400,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

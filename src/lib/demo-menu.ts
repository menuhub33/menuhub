import type {
  CategoryWithProducts,
  ProductWithRelations,
  PublicMenuData,
} from "@/components/lib/types";
import type {
  Branch,
  ProductImage,
  ProductOption,
  ProductOptionGroup,
  Restaurant,
  RestaurantTheme,
  SocialLink,
} from "@/lib/types";

export const DEMO_MENU_SLUG = "demo";

const NOW = "2026-01-15T10:00:00.000Z";
const RESTAURANT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const MENU_ID = "aaaaaaaa-0000-4000-8000-000000000002";

export const DEMO_BUSINESS_HOURS = [
  { day_of_week: 0, open_time: "12:00", close_time: "23:00", is_closed: false },
  { day_of_week: 1, open_time: "12:00", close_time: "23:00", is_closed: false },
  { day_of_week: 2, open_time: "12:00", close_time: "23:00", is_closed: false },
  { day_of_week: 3, open_time: "12:00", close_time: "23:00", is_closed: false },
  { day_of_week: 4, open_time: "12:00", close_time: "00:00", is_closed: false },
  { day_of_week: 5, open_time: "13:00", close_time: "00:00", is_closed: false },
  { day_of_week: 6, open_time: "12:00", close_time: "23:00", is_closed: false },
];

function uid(n: number) {
  return `aaaaaaaa-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function img(file: string): ProductImage[] {
  return [
    {
      id: uid(9000 + file.length + file.charCodeAt(0)),
      product_id: "",
      image_url: `/demo/${file}`,
      sort_order: 0,
      is_primary: true,
      created_at: NOW,
    },
  ];
}

function addonsGroup(productId: string, index: number): ProductOptionGroup & { options: ProductOption[] } {
  const groupId = uid(700 + index);
  const extras = [
    { name_ar: "صوص ثوم", name_en: "Garlic sauce", delta: 0 },
    { name_ar: "صوص باربكيو", name_en: "BBQ sauce", delta: 0 },
    { name_ar: "جبنة إضافية", name_en: "Extra cheese", delta: 3000 },
  ];
  return {
    id: groupId,
    product_id: productId,
    name_ar: "إضافات",
    name_en: "Extras",
    selection_type: "MULTIPLE",
    is_required: false,
    min_selection: 0,
    max_selection: 3,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    options: extras.map((item, optionIndex) => ({
      id: uid(720 + index * 4 + optionIndex),
      option_group_id: groupId,
      name_ar: item.name_ar,
      name_en: item.name_en,
      price_delta: item.delta,
      sort_order: optionIndex,
      is_active: true,
      created_at: NOW,
      updated_at: NOW,
    })),
  };
}

function sizeGroup(productId: string, index: number): ProductOptionGroup & { options: ProductOption[] } {
  const groupId = uid(500 + index);
  return {
    id: groupId,
    product_id: productId,
    name_ar: "الحجم",
    name_en: "Size",
    selection_type: "SINGLE",
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    options: [
      {
        id: uid(600 + index * 2),
        option_group_id: groupId,
        name_ar: "وسط",
        name_en: "Medium",
        price_delta: 0,
        sort_order: 0,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: uid(601 + index * 2),
        option_group_id: groupId,
        name_ar: "كبير",
        name_en: "Large",
        price_delta: 8000,
        sort_order: 1,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  };
}

const restaurant: Restaurant = {
  id: RESTAURANT_ID,
  name: "بيت الشام",
  slug: DEMO_MENU_SLUG,
  description: "مطعم شامي بروح دمشقية — مشاوي، بيتزا، مقبلات وحلويات. منيو تجريبي جاهز للعرض.",
  phone: "0991122334",
  whatsapp: "963991122334",
  email: "demo@menuhub.com",
  logo_url: "/demo/logo.png",
  cover_image_url: "/demo/cover.jpg",
  address: "دمشق — المالكي، شارع أبي رمانة",
  latitude: 33.5138,
  longitude: 36.2765,
  timezone: "Asia/Damascus",
  default_language: "ar",
  currency: "SYP",
  status: "ACTIVE",
  menu_status: "PUBLISHED",
  delivery_enabled: true,
  business_type: "RESTAURANT",
  chatbot_enabled: true,
  chatbot_name: "مساعد بيت الشام",
  chatbot_welcome:
    "أهلاً بك في بيت الشام. اسألني عن المشاوي، البيتزا، المقبلات أو الأسعار. إذا ما عرفت الجواب بحوّلك على رقم التواصل.",
  created_at: NOW,
  updated_at: NOW,
};

const theme: RestaurantTheme = {
  id: uid(3),
  restaurant_id: RESTAURANT_ID,
  theme_id: null,
  primary_color: "#c4a574",
  secondary_color: "#8a6d45",
  background_color: "#f7f7f7",
  text_color: "#18181b",
  font_family: "Expo Arabic",
  custom_css: null,
  created_at: NOW,
  updated_at: NOW,
};

const socialLinks: SocialLink[] = [
  {
    id: uid(4),
    restaurant_id: RESTAURANT_ID,
    platform: "instagram",
    url: "https://instagram.com/baitalsham",
    is_active: true,
    sort_order: 0,
    created_at: NOW,
  },
  {
    id: uid(7),
    restaurant_id: RESTAURANT_ID,
    platform: "facebook",
    url: "https://facebook.com/baitalsham",
    is_active: true,
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: uid(5),
    restaurant_id: RESTAURANT_ID,
    platform: "whatsapp",
    url: "963991122334",
    is_active: true,
    sort_order: 2,
    created_at: NOW,
  },
];

const branches: Array<Pick<Branch, "id" | "name" | "address" | "phone">> = [
  {
    id: uid(6),
    name: "فرع المالكي",
    address: "دمشق — المالكي، شارع أبي رمانة",
    phone: "0991122334",
  },
];

function product(input: {
  n: number;
  categoryId: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  price: number;
  old_price?: number | null;
  file: string;
  featured?: boolean;
  sort: number;
  options?: "size" | "addons";
}): ProductWithRelations {
  const id = uid(input.n);
  const images = img(input.file).map((item) => ({ ...item, id: uid(input.n + 800), product_id: id }));
  const option_groups =
    input.options === "size"
      ? [sizeGroup(id, input.n)]
      : input.options === "addons"
        ? [addonsGroup(id, input.n)]
        : [];
  return {
    id,
    category_id: input.categoryId,
    name_ar: input.name_ar,
    name_en: input.name_en,
    description_ar: input.description_ar,
    description_en: null,
    price: input.price,
    old_price: input.old_price ?? null,
    currency: "SYP",
    sort_order: input.sort,
    status: "AVAILABLE",
    is_featured: Boolean(input.featured),
    created_at: NOW,
    updated_at: NOW,
    images,
    option_groups,
  };
}

function category(
  n: number,
  name_ar: string,
  name_en: string,
  image: string,
  sort: number,
  products: ProductWithRelations[]
): CategoryWithProducts {
  return {
    id: uid(n),
    menu_id: MENU_ID,
    name_ar,
    name_en,
    description_ar: null,
    description_en: null,
    image_url: `/demo/${image}`,
    sort_order: sort,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
    products,
  };
}

const CAT_APP = uid(10);
const CAT_GRILL = uid(11);
const CAT_PIZZA = uid(12);
const CAT_DRINK = uid(13);
const CAT_SWEET = uid(14);

export function getDemoPublicMenu(): PublicMenuData {
  const categories: CategoryWithProducts[] = [
    category(10, "المقبلات", "Appetizers", "fattoush.jpg", 0, [
      product({
        n: 100,
        categoryId: CAT_APP,
        name_ar: "حمص بالطحينة",
        name_en: "Hummus",
        description_ar: "حمص كريمي مع زيت الزيتون والصنوبر.",
        price: 15000,
        file: "hummus.jpg",
        sort: 0,
      }),
      product({
        n: 101,
        categoryId: CAT_APP,
        name_ar: "تبولة",
        name_en: "Tabbouleh",
        description_ar: "بقدونس، برغل ناعم، بندورة وليمون.",
        price: 14000,
        file: "tabbouleh.jpg",
        sort: 1,
      }),
      product({
        n: 102,
        categoryId: CAT_APP,
        name_ar: "فتوش",
        name_en: "Fattoush",
        description_ar: "خضار موسمية مع خبز مقلي وخل الرمان.",
        price: 16000,
        file: "fattoush.jpg",
        sort: 2,
        featured: true,
      }),
      product({
        n: 103,
        categoryId: CAT_APP,
        name_ar: "رقائق جبنة",
        name_en: "Cheese rolls",
        description_ar: "عجينة مقرمشة محشوة جبنة مع صوص غارلك.",
        price: 18000,
        file: "cheese-rolls.jpg",
        sort: 3,
      }),
    ]),
    category(11, "المشاوي", "Grills", "mixed-grill.jpg", 1, [
      product({
        n: 110,
        categoryId: CAT_GRILL,
        name_ar: "مشكل مشاوي",
        name_en: "Mixed grill",
        description_ar: "كباب، شيش، وكفتة مع أرز وفحم.",
        price: 75000,
        old_price: 85000,
        file: "mixed-grill.jpg",
        sort: 0,
        featured: true,
        options: "addons",
      }),
      product({
        n: 111,
        categoryId: CAT_GRILL,
        name_ar: "شيش طاووق",
        name_en: "Shish tawook",
        description_ar: "صدور دجاج متبّلة مشوية على الفحم.",
        price: 52000,
        file: "shish-tawook.jpg",
        sort: 1,
        featured: true,
        options: "addons",
      }),
      product({
        n: 112,
        categoryId: CAT_GRILL,
        name_ar: "كباب حلبي",
        name_en: "Aleppo kebab",
        description_ar: "كباب لحم غنم مع بهارات حلبية.",
        price: 58000,
        file: "kebab.jpg",
        sort: 2,
        options: "addons",
      }),
      product({
        n: 113,
        categoryId: CAT_GRILL,
        name_ar: "أجنحة دجاج",
        name_en: "Chicken wings",
        description_ar: "أجنحة مقرمشة بصوص حار أو باربكيو.",
        price: 38000,
        file: "wings.jpg",
        sort: 3,
        options: "addons",
      }),
    ]),
    category(12, "البيتزا", "Pizza", "pizza-margherita.jpg", 2, [
      product({
        n: 120,
        categoryId: CAT_PIZZA,
        name_ar: "بيتزا مارغريتا",
        name_en: "Margherita",
        description_ar: "صلصة طماطم، موزاريلا، وريحان.",
        price: 38000,
        old_price: 45000,
        file: "pizza-margherita.jpg",
        sort: 0,
        featured: true,
        options: "size",
      }),
      product({
        n: 121,
        categoryId: CAT_PIZZA,
        name_ar: "بيتزا بيبروني",
        name_en: "Pepperoni",
        description_ar: "بيبروني، موزاريلا، وصلصة حارة خفيفة.",
        price: 48000,
        file: "pizza-pepperoni.jpg",
        sort: 1,
        options: "size",
      }),
      product({
        n: 122,
        categoryId: CAT_PIZZA,
        name_ar: "بيتزا أربعة أجبان",
        name_en: "Quattro formaggi",
        description_ar: "خليط أجبان غني على عجينة ذهبية.",
        price: 52000,
        file: "pizza-four-cheese.jpg",
        sort: 2,
        options: "size",
      }),
      product({
        n: 123,
        categoryId: CAT_PIZZA,
        name_ar: "بيتزا دجاج باربكيو",
        name_en: "BBQ chicken",
        description_ar: "دجاج، بصل، صوص باربكيو وجبنة.",
        price: 50000,
        file: "pizza-chicken.jpg",
        sort: 3,
        options: "size",
      }),
    ]),
    category(13, "المشروبات", "Drinks", "orange-juice.jpg", 3, [
      product({
        n: 130,
        categoryId: CAT_DRINK,
        name_ar: "عصير برتقال طازج",
        name_en: "Fresh orange",
        description_ar: "برتقال معصور يومياً.",
        price: 12000,
        file: "orange-juice.jpg",
        sort: 0,
      }),
      product({
        n: 131,
        categoryId: CAT_DRINK,
        name_ar: "ليموناضة بالنعناع",
        name_en: "Mint lemonade",
        description_ar: "ليمون، نعناع، وثلج.",
        price: 10000,
        file: "lemonade.jpg",
        sort: 1,
      }),
      product({
        n: 132,
        categoryId: CAT_DRINK,
        name_ar: "قهوة",
        name_en: "Coffee",
        description_ar: "قهوة محمّصة تقدم ساخنة.",
        price: 8000,
        file: "coffee.jpg",
        sort: 2,
      }),
      product({
        n: 133,
        categoryId: CAT_DRINK,
        name_ar: "شاي بالنعناع",
        name_en: "Mint tea",
        description_ar: "شاي أحمر مع نعنع طازج.",
        price: 6000,
        file: "mint-tea.jpg",
        sort: 3,
      }),
    ]),
    category(14, "الحلويات", "Desserts", "cheesecake.jpg", 4, [
      product({
        n: 140,
        categoryId: CAT_SWEET,
        name_ar: "كيك الشوكولا",
        name_en: "Chocolate cake",
        description_ar: "كيك شوكولا غني مع صوص.",
        price: 22000,
        old_price: 26000,
        file: "kunafa.jpg",
        sort: 0,
        featured: true,
      }),
      product({
        n: 141,
        categoryId: CAT_SWEET,
        name_ar: "بقلاوة",
        name_en: "Baklava",
        description_ar: "عجين مقرمش، فستق وقطر.",
        price: 18000,
        file: "baklava.jpg",
        sort: 1,
      }),
      product({
        n: 142,
        categoryId: CAT_SWEET,
        name_ar: "تشيز كيك",
        name_en: "Cheesecake",
        description_ar: "تشيز كيك بارد مع توت.",
        price: 24000,
        file: "cheesecake.jpg",
        sort: 2,
      }),
      product({
        n: 143,
        categoryId: CAT_SWEET,
        name_ar: "آيس كريم",
        name_en: "Ice cream",
        description_ar: "ثلاث كرات حسب الاختيار.",
        price: 16000,
        file: "ice-cream.jpg",
        sort: 3,
      }),
    ]),
  ];

  return {
    restaurant,
    menu: {
      id: MENU_ID,
      restaurant_id: RESTAURANT_ID,
      name: "المنيو الرئيسي",
      slug: "main",
      description: "منيو بيت الشام التجريبي",
      status: "PUBLISHED",
      is_default: true,
      published_at: NOW,
      created_at: NOW,
      updated_at: NOW,
    },
    theme,
    categories,
    socialLinks,
    branches,
  };
}

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

export const DEMO_CARS_MENU_SLUG = "demo-cars";

const NOW = "2026-01-15T10:00:00.000Z";
const SHOWROOM_ID = "bbbbbbbb-0000-4000-8000-000000000001";
const MENU_ID = "bbbbbbbb-0000-4000-8000-000000000002";

export const DEMO_CARS_BUSINESS_HOURS = [
  { day_of_week: 0, open_time: "09:00", close_time: "21:00", is_closed: false },
  { day_of_week: 1, open_time: "09:00", close_time: "21:00", is_closed: false },
  { day_of_week: 2, open_time: "09:00", close_time: "21:00", is_closed: false },
  { day_of_week: 3, open_time: "09:00", close_time: "21:00", is_closed: false },
  { day_of_week: 4, open_time: "09:00", close_time: "21:00", is_closed: false },
  { day_of_week: 5, open_time: "10:00", close_time: "18:00", is_closed: false },
  { day_of_week: 6, open_time: "09:00", close_time: "21:00", is_closed: false },
];

function uid(n: number) {
  return `bbbbbbbb-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function img(file: string): ProductImage[] {
  return [
    {
      id: uid(9000 + file.length + file.charCodeAt(0)),
      product_id: "",
      image_url: `/demo-cars/${file}`,
      sort_order: 0,
      is_primary: true,
      created_at: NOW,
    },
  ];
}

function colorGroup(productId: string, index: number): ProductOptionGroup & { options: ProductOption[] } {
  const groupId = uid(2000 + index);
  const colors = [
    { name_ar: "أبيض لؤلؤي", name_en: "Pearl white", delta: 0 },
    { name_ar: "أسود معدني", name_en: "Metallic black", delta: 400 },
    { name_ar: "رمادي تيتانيوم", name_en: "Titanium gray", delta: 500 },
    { name_ar: "أزرق ليلي", name_en: "Midnight blue", delta: 700 },
  ];
  return {
    id: groupId,
    product_id: productId,
    name_ar: "اللون",
    name_en: "Color",
    selection_type: "SINGLE",
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    sort_order: 0,
    created_at: NOW,
    updated_at: NOW,
    options: colors.map((item, optionIndex) => ({
      id: uid(5000 + index * 10 + optionIndex),
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

function extrasGroup(
  productId: string,
  index: number
): ProductOptionGroup & { options: ProductOption[] } {
  const groupId = uid(3000 + index);
  const extras = [
    { name_ar: "فتحة سقف", name_en: "Sunroof", delta: 600 },
    { name_ar: "مقاعد جلد", name_en: "Leather seats", delta: 800 },
    { name_ar: "فحص ميكانيك شامل", name_en: "Full inspection", delta: 150 },
    { name_ar: "تأمين لسنة", name_en: "One-year insurance", delta: 400 },
  ];
  return {
    id: groupId,
    product_id: productId,
    name_ar: "إضافات",
    name_en: "Extras",
    selection_type: "MULTIPLE",
    is_required: false,
    min_selection: 0,
    max_selection: 4,
    sort_order: 2,
    created_at: NOW,
    updated_at: NOW,
    options: extras.map((item, optionIndex) => ({
      id: uid(6000 + index * 10 + optionIndex),
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

function trimGroup(
  productId: string,
  index: number,
  delta: number
): ProductOptionGroup & { options: ProductOption[] } {
  const groupId = uid(4000 + index);
  return {
    id: groupId,
    product_id: productId,
    name_ar: "فئة التجهيز",
    name_en: "Trim",
    selection_type: "SINGLE",
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    sort_order: 1,
    created_at: NOW,
    updated_at: NOW,
    options: [
      {
        id: uid(7000 + index * 2),
        option_group_id: groupId,
        name_ar: "ستاندرد",
        name_en: "Standard",
        price_delta: 0,
        sort_order: 0,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        id: uid(7001 + index * 2),
        option_group_id: groupId,
        name_ar: "فل أوبشن",
        name_en: "Full option",
        price_delta: delta,
        sort_order: 1,
        is_active: true,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  };
}

const restaurant: Restaurant = {
  id: SHOWROOM_ID,
  name: "أوتو الشام",
  slug: DEMO_CARS_MENU_SLUG,
  description:
    "معرض سيارات في دمشق — موديلات 2020 وأقدم: تكاسي مثل ريو 2011، BMW، أودي، ميتسوبيشي، سنتافيه وبرادو.",
  phone: "0993344556",
  whatsapp: "963993344556",
  email: "cars@menuhub.com",
  logo_url: "/demo-cars/logo.svg",
  cover_image_url: "/demo-cars/cover.jpg",
  address: "دمشق — المزة، أوتوستراد المزة",
  latitude: 33.5042,
  longitude: 36.2681,
  timezone: "Asia/Damascus",
  default_language: "ar",
  currency: "USD",
  status: "ACTIVE",
  menu_status: "PUBLISHED",
  delivery_enabled: false,
  business_type: "SHOP",
  chatbot_enabled: true,
  chatbot_name: "مساعد أوتو الشام",
  chatbot_welcome:
    "أهلاً بك في أوتو الشام. اسألني عن التكاسي مثل ريو 2011، BMW، أودي، ميتسوبيشي، أو عن سنتافيه وبرادو والأسعار.",
  created_at: NOW,
  updated_at: NOW,
};

const theme: RestaurantTheme = {
  id: uid(3),
  restaurant_id: SHOWROOM_ID,
  theme_id: null,
  primary_color: "#1e3a5f",
  secondary_color: "#c9a227",
  background_color: "#f4f6f8",
  text_color: "#0f172a",
  font_family: "Expo Arabic",
  custom_css: null,
  created_at: NOW,
  updated_at: NOW,
};

const socialLinks: SocialLink[] = [
  {
    id: uid(4),
    restaurant_id: SHOWROOM_ID,
    platform: "instagram",
    url: "https://instagram.com/autoalsham",
    is_active: true,
    sort_order: 0,
    created_at: NOW,
  },
  {
    id: uid(7),
    restaurant_id: SHOWROOM_ID,
    platform: "facebook",
    url: "https://facebook.com/autoalsham",
    is_active: true,
    sort_order: 1,
    created_at: NOW,
  },
  {
    id: uid(5),
    restaurant_id: SHOWROOM_ID,
    platform: "whatsapp",
    url: "963993344556",
    is_active: true,
    sort_order: 2,
    created_at: NOW,
  },
];

const branches: Array<Pick<Branch, "id" | "name" | "address" | "phone">> = [
  {
    id: uid(6),
    name: "فرع المزة",
    address: "دمشق — المزة، أوتوستراد المزة",
    phone: "0993344556",
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
  trimDelta?: number;
}): ProductWithRelations {
  const id = uid(input.n);
  const images = img(input.file).map((item) => ({ ...item, id: uid(input.n + 800), product_id: id }));
  const option_groups = [
    colorGroup(id, input.n),
    ...(input.trimDelta != null ? [trimGroup(id, input.n, input.trimDelta)] : []),
    extrasGroup(id, input.n),
  ];
  return {
    id,
    category_id: input.categoryId,
    name_ar: input.name_ar,
    name_en: input.name_en,
    description_ar: input.description_ar,
    description_en: null,
    price: input.price,
    old_price: input.old_price ?? null,
    currency: "USD",
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
    image_url: `/demo-cars/${image}`,
    sort_order: sort,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
    products,
  };
}

const CAT_TAXI = uid(14);
const CAT_SEDAN = uid(10);
const CAT_EURO = uid(15);
const CAT_SUV = uid(11);
const CAT_4WD = uid(12);
const CAT_PICKUP = uid(13);

export function getDemoCarsPublicMenu(): PublicMenuData {
  const categories: CategoryWithProducts[] = [
    category(14, "تكاسي", "Taxis", "rio.jpg", 0, [
      product({
        n: 140,
        categoryId: CAT_TAXI,
        name_ar: "كيا ريو 2011",
        name_en: "Kia Rio 2011",
        description_ar: "تكسي شامي كلاسيكي — اقتصادية، قطع غيار متوفرة ومناسبة للعمل اليومي.",
        price: 4800,
        old_price: 5500,
        file: "rio.jpg",
        sort: 0,
        featured: true,
        trimDelta: 400,
      }),
      product({
        n: 141,
        categoryId: CAT_TAXI,
        name_ar: "ميتسوبيشي لانسر 2011",
        name_en: "Mitsubishi Lancer 2011",
        description_ar: "لانسر عملية للتكسي والمدينة، محرك 1.6 واستهلاك منخفض.",
        price: 6900,
        file: "lancer.jpg",
        sort: 1,
        featured: true,
        trimDelta: 500,
      }),
    ]),
    category(10, "سيدان", "Sedan", "elantra.jpg", 1, [
      product({
        n: 100,
        categoryId: CAT_SEDAN,
        name_ar: "هيونداي إلنترا 2017",
        name_en: "Hyundai Elantra 2017",
        description_ar: "سيدان اقتصادية بمحرك 1.6، صيانة سهلة واستهلاك منخفض.",
        price: 11800,
        old_price: 13200,
        file: "elantra.jpg",
        sort: 0,
        featured: true,
        trimDelta: 900,
      }),
      product({
        n: 101,
        categoryId: CAT_SEDAN,
        name_ar: "تويوتا كامري 2017",
        name_en: "Toyota Camry 2017",
        description_ar: "راحة عائلية وسمعة صيانة ممتازة، مناسبة للطريق الطويل.",
        price: 14800,
        file: "camry.jpg",
        sort: 1,
        trimDelta: 1100,
      }),
      product({
        n: 102,
        categoryId: CAT_SEDAN,
        name_ar: "تويوتا كورولا 2018",
        name_en: "Toyota Corolla 2018",
        description_ar: "أكثر السيدان طلباً — قطع غيار متوفرة واعتمادية عالية.",
        price: 12600,
        file: "corolla.jpg",
        sort: 2,
        featured: true,
        trimDelta: 850,
      }),
      product({
        n: 103,
        categoryId: CAT_SEDAN,
        name_ar: "كيا سيراتو 2018",
        name_en: "Kia Cerato 2018",
        description_ar: "سيدان عملية بضمان كيا السابق وتجهيزات مريحة.",
        price: 10900,
        file: "cerato.jpg",
        sort: 3,
        trimDelta: 750,
      }),
    ]),
    category(15, "أوروبية", "European", "bmw-320.jpg", 2, [
      product({
        n: 150,
        categoryId: CAT_EURO,
        name_ar: "بي إم دبليو 320i 2012",
        name_en: "BMW 320i 2012",
        description_ar: "فئة ثالثة F30، قيادة مريحة ومناسبة كتكسي فخم أو استخدام شخصي.",
        price: 12500,
        old_price: 13800,
        file: "bmw-320.jpg",
        sort: 0,
        featured: true,
        trimDelta: 1100,
      }),
      product({
        n: 151,
        categoryId: CAT_EURO,
        name_ar: "بي إم دبليو 520i 2012",
        name_en: "BMW 520i 2012",
        description_ar: "فئة خامسة واسعة، داخلية فخمة ومناسبة للطريق الطويل.",
        price: 14800,
        file: "bmw-520.jpg",
        sort: 1,
        trimDelta: 1300,
      }),
      product({
        n: 152,
        categoryId: CAT_EURO,
        name_ar: "أودي A4 2013",
        name_en: "Audi A4 2013",
        description_ar: "سيدان ألمانية أنيقة بمحرك توربو وتجهيزات مريحة.",
        price: 13200,
        file: "audi-a4.jpg",
        sort: 2,
        featured: true,
        trimDelta: 1200,
      }),
      product({
        n: 153,
        categoryId: CAT_EURO,
        name_ar: "أودي A6 2013",
        name_en: "Audi A6 2013",
        description_ar: "فئة تنفيذية بمساحة خلفية واسعة وهدوء على الطريق.",
        price: 15500,
        file: "audi-a6.jpg",
        sort: 3,
        trimDelta: 1400,
      }),
    ]),
    category(11, "SUV", "SUV", "santa-fe.jpg", 3, [
      product({
        n: 110,
        categoryId: CAT_SUV,
        name_ar: "هيونداي سنتافيه 2019",
        name_en: "Hyundai Santa Fe 2019",
        description_ar: "عائلية واسعة 7 راكب، محرك قوي ومساحة صندوق كبيرة.",
        price: 19800,
        old_price: 21500,
        file: "santa-fe.jpg",
        sort: 0,
        featured: true,
        trimDelta: 1400,
      }),
      product({
        n: 111,
        categoryId: CAT_SUV,
        name_ar: "كيا سبورتاج 2018",
        name_en: "Kia Sportage 2018",
        description_ar: "كروس أوفر عملية للمدينة والسفر، استهلاك معقول.",
        price: 15200,
        file: "sportage.jpg",
        sort: 1,
        featured: true,
        trimDelta: 1100,
      }),
      product({
        n: 112,
        categoryId: CAT_SUV,
        name_ar: "كيا سورنتو 2017",
        name_en: "Kia Sorento 2017",
        description_ar: "SUV عائلية بمحرك V6 وخيار دفع رباعي.",
        price: 17800,
        file: "sorento.jpg",
        sort: 2,
        trimDelta: 1300,
      }),
      product({
        n: 113,
        categoryId: CAT_SUV,
        name_ar: "هيونداي توسان 2018",
        name_en: "Hyundai Tucson 2018",
        description_ar: "حجم مناسب للعائلة الصغيرة، كاميرا خلفية وشاشة.",
        price: 14500,
        file: "tucson.jpg",
        sort: 3,
        trimDelta: 950,
      }),
      product({
        n: 114,
        categoryId: CAT_SUV,
        name_ar: "ميتسوبيشي أوتلاندر 2014",
        name_en: "Mitsubishi Outlander 2014",
        description_ar: "كروس عائلية بسبع مقاعد وخيار دفع رباعي.",
        price: 12800,
        file: "outlander.jpg",
        sort: 4,
        trimDelta: 900,
      }),
    ]),
    category(12, "دفع رباعي", "4x4", "prado.jpg", 4, [
      product({
        n: 120,
        categoryId: CAT_4WD,
        name_ar: "تويوتا برادو 2018",
        name_en: "Toyota Prado 2018",
        description_ar: "دفع رباعي أسطوري للسفر والطرق الوعرة، 7 راكب.",
        price: 36500,
        old_price: 39200,
        file: "prado.jpg",
        sort: 0,
        featured: true,
        trimDelta: 2800,
      }),
      product({
        n: 121,
        categoryId: CAT_4WD,
        name_ar: "تويوتا فورتشنر 2018",
        name_en: "Toyota Fortuner 2018",
        description_ar: "دفع رباعي دييزل، مناسب للعائلات والعمل.",
        price: 24800,
        file: "fortuner.jpg",
        sort: 1,
        trimDelta: 1800,
      }),
      product({
        n: 122,
        categoryId: CAT_4WD,
        name_ar: "ميتسوبيشي باجيرو 2015",
        name_en: "Mitsubishi Pajero 2015",
        description_ar: "باجيرو طويل، قوي على الطريق ومطلوب في السوق.",
        price: 18900,
        file: "pajero.jpg",
        sort: 2,
        trimDelta: 1200,
      }),
    ]),
    category(13, "بيك أب", "Pickup", "hilux.jpg", 5, [
      product({
        n: 130,
        categoryId: CAT_PICKUP,
        name_ar: "تويوتا هايلكس 2016",
        name_en: "Toyota Hilux 2016",
        description_ar: "بيك أب غمارتين للعمل والسفر، تحمل عالي.",
        price: 19800,
        file: "hilux.jpg",
        sort: 0,
        trimDelta: 1500,
      }),
    ]),
  ];

  return {
    restaurant,
    menu: {
      id: MENU_ID,
      restaurant_id: SHOWROOM_ID,
      name: "كتالوج السيارات",
      slug: "main",
      description: "كتالوج أوتو الشام التجريبي",
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

# MenuHub — وثيقة الهندسة العكسية الكاملة

> وثيقة مستخلصة من قراءة الكود الفعلي للمشروع (وليس من الـ PRD فقط). تغطي المعمارية، الصفحات، الميزات، قاعدة البيانات، الصلاحيات، مسارات البيانات، والثغرات/الفجوات المعروفة.
> الوثيقة بالعربية، والمعرّفات التقنية (أسماء الملفات والجداول والدوال) بالإنجليزية كما هي في الكود.

---

## 1. نظرة عامة

**MenuHub** منصة SaaS متعددة المستأجرين (Multi-tenant) لإنشاء ونشر **منيو رقمي** (QR Menu) للمطاعم والكافيهات والمتاجر، بواجهة عربية RTL بالكامل.

- **المستأجر (Tenant)** = جدول `restaurants`، وله `business_type` ∈ `RESTAURANT | CAFE | SHOP`.
- كل مستأجر له **منيو عام** على رابط فرعي: `https://{slug}.{ROOT_DOMAIN}` (أو `/m/{slug}` على localhost والاستضافات المشتركة).
- **التزويد (Provisioning) يدوي من الأدمن**: التسجيل الذاتي ينشئ **مستخدماً فقط**؛ مدير المنصة هو من ينشئ المطعم ويفعّله ويربطه بالمالك.
- **الطلبات عبر واتساب**: السلة تُبنى في المتصفح ثم تُرسل كفاتورة نصية عبر `wa.me`. **لا توجد طلبات مخزّنة في الخادم**.
- **شات بوت للمنيو** (LLM متوافق مع OpenAI + رد احتياطي قائم على قواعد بالعربية).
- **وحدة مالية للأدمن**: عقود، خصومات، أقساط، تجديدات سنوية، وصافي الربح.

### مقارنة سريعة مع الـ PRD (`prd.md`)

| بند الـ PRD | الواقع في الكود |
|---|---|
| Backend بـ Laravel API | غير موجود. الباك إند = Next.js Server Actions + Supabase |
| تسجيل ذاتي وإنشاء مطعم | التسجيل ينشئ مستخدماً فقط؛ المطعم ينشئه الأدمن |
| خطط واشتراكات مع حدود | الجداول والواجهات موجودة، **لكن الحدود غير مفروضة** |
| فروع متعددة | جدول وـ Actions موجودة، **بلا واجهة** |
| نطاقات مخصصة | جدول وـ Actions موجودة، **بلا واجهة ولا ربط حقيقي** |
| الطلبات (لاحقاً) | طلب عبر واتساب فقط، بلا تخزين |

---

## 2. الحزمة التقنية

| الطبقة | التقنية |
|---|---|
| إطار العمل | **Next.js 16.3.3** App Router (يستخدم `src/proxy.ts` بدلاً من `middleware.ts`) |
| واجهة | React 19.2.8، Tailwind CSS 4، TypeScript (strict) |
| الجودة | ESLint 9 (`eslint-config-next`) |
| المصادقة/قاعدة البيانات | Supabase (Auth + Postgres + RLS + RPC) عبر `@supabase/ssr` |
| تخزين الصور | Cloudflare R2 عبر AWS S3 SDK + تحسين بـ `sharp` (WebP) |
| الذكاء الاصطناعي | واجهة OpenAI-compatible (اختيارية) |
| QR | خدمة خارجية `api.qrserver.com` |
| الخط | ExpoArabic (محلي) |
| الاختبارات | `tsx --test` (14 اختباراً لمنطق الصور) |

**ملاحظات الإعداد (`next.config.ts`):**
- `images.remotePatterns` لـ Supabase وR2، صيغ `avif/webp`، TTL ٣٠ يوماً.
- `serverExternalPackages: ["@aws-sdk/client-s3", "sharp"]`.
- `experimental.authInterrupts` → يتيح `forbidden()` وصفحة `forbidden.tsx`.
- `serverActions.bodySizeLimit = "8mb"`.
- سكربتات `dev` و`start` تستخدم `--max-http-header-size=131072` (كوكيز Supabase كبيرة).
- الأسلوب `@/*` ← `./src/*` في `tsconfig.json`.

> تنبيه `AGENTS.md`: هذه نسخة Next.js ذات تغييرات جوهرية؛ يجب الرجوع إلى `node_modules/next/dist/docs/` قبل تعديل الكود.

---

## 3. متغيرات البيئة (الأسماء فقط — `.env.example`)

- **Supabase**: عنوان المشروع، المفتاح العام (publishable/anon)، ومفتاح **service-role** (اختياري، يُستخدم في صلاحيات الأدمن وبعض الـ fallbacks).
- **التطبيق**: عنوان التطبيق العام، و`ROOT_DOMAIN` لاستخراج النطاق الفرعي.
- **الشات بوت**: مفتاح/رابط/اسم نموذج LLM (اختياري).
- **R2**: معرّف الحساب، مفتاحا الوصول، اسم الـ bucket، والرابط العام.

`.env*` مُتجاهَل في git عدا `.env.example`.

---

## 4. هيكل المجلدات

```
menuhub/
├─ prd.md                    الـ PRD الأصلي
├─ schame.md                 المخطط المرجعي لقاعدة البيانات + RLS + seeds
├─ supabase/migrations/      00014 chatbot · 00015 billing · 00016 setup_cost
└─ src/
   ├─ proxy.ts               توجيه النطاقات الفرعية + حماية المسارات
   ├─ app/                   الصفحات (انظر القسم 7)
   ├─ actions/               Server Actions مقسّمة حسب الكيان
   ├─ components/
   │   ├─ ui/ forms/ common/ layout/      مكتبة واجهة داخلية
   │   ├─ public-menu/                    المنيو العام
   │   ├─ views/                          شاشات اللوحة والأدمن
   │   ├─ themes/ qr/ analytics/ ...      مكوّنات متخصصة
   │   └─ lib/                            labels, format, cn, types واجهة
   └─ lib/
       ├─ auth/        session, permissions, guards, authorization
       ├─ supabase/    server, admin, proxy, cookies
       ├─ config.ts, action.ts, types.ts
       ├─ image-objects / optimize-image / r2 / storage / ...
       ├─ menu-chat.ts, order-invoice.ts, phone.ts, social.ts
       ├─ menu-billing.ts, save-menu-billing.ts
       └─ demo-catalog / demo-menu / demo-cars-menu
```

---

## 5. المعمارية العامة

### 5.1 توجيه المستأجرين (`src/proxy.ts`)

1. يستخرج النطاق الفرعي من `Host` (`extractSubdomain` في `lib/config.ts`).
2. إن كان النطاق الفرعي **غير محجوز** (`isReservedSubdomain`) → **rewrite** إلى `/m/{subdomain}{path}`.
3. يُحدّث جلسة Supabase (`lib/supabase/proxy.ts`) ويُعيد كتابة الكوكيز.
4. يحمي مسارات: `/dashboard`، `/admin`، `/onboarding` → تحويل إلى `/login?next=...` عند غياب الجلسة. ويحوّل المستخدم المسجّل بعيداً عن صفحات الدخول/التسجيل.
5. يقرأ `?restaurant=<id>` ويحفظه في كوكي **`mh-restaurant-id`** لاختيار المطعم الحالي.

```ts
const subdomain = extractSubdomain(request.headers.get("host") ?? "");
if (subdomain && !isReservedSubdomain(subdomain)) {
  url.pathname = `/m/${subdomain}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}
```

**المسار الاحتياطي**: على `localhost` واستضافات مثل `vercel.app` يُستخدم `/m/{slug}` مباشرة (`usePublicMenuHost` يبني الرابط العام المناسب).

### 5.2 عملاء Supabase

| الملف | الاستخدام |
|---|---|
| `supabase/server.ts` | عميل بجلسة المستخدم (RLS مفعّل) — الافتراضي في كل Action |
| `supabase/admin.ts` | عميل **service-role** (يتجاوز RLS) — أدمن/تجهيز/Fallbacks |
| `supabase/proxy.ts` | تحديث الجلسة داخل `proxy.ts` |
| `supabase/cookies.ts` | `cookieEncoding: raw` |

### 5.3 نمط نتيجة الـ Actions

كل Server Action ترجع `ActionResult<T>` (`lib/action.ts`):

```ts
ok(data)    // { data, error: null }
fail("رسالة عربية") // { data: null, error }
```

مع مساعدات: `requireUser`، `getRestaurantMembership`، `hasRestaurantRole`، `getRestaurantIdByMenu`، `revalidateRestaurantPublicMenu`.

### 5.4 المنيو العام والتخزين المؤقت

الـ Actions التي تعدّل المحتوى تستدعي `revalidateRestaurantPublicMenu` لإعادة توليد صفحة `/m/{slug}`.

---

## 6. المصادقة والصلاحيات

### 6.1 الأدوار

- **دور المنصة** (`profiles.platform_role`): `USER` · `ADMIN` · `SUPER_ADMIN`.
- **دور المطعم** (`restaurant_users.role`): `OWNER` · `MANAGER` · `EDITOR`.

### 6.2 مصفوفة الصلاحيات (`lib/auth/permissions.ts`)

| الصلاحية | OWNER | MANAGER | EDITOR |
|---|:-:|:-:|:-:|
| عرض المطعم/القائمة/الإعدادات | ✓ | ✓ | ✓ |
| تعديل المطعم (`restaurant.update`) | ✓ | ✓ | ✗ |
| الأقسام: عرض/إنشاء/تعديل | ✓ | ✓ | ✓ |
| الأقسام: حذف | ✓ | ✓ | ✗ |
| المنتجات: إنشاء/تعديل/توفر | ✓ | ✓ | ✓ |
| المنتجات: حذف | ✓ | ✓ | ✗ |
| الخيارات (`options.manage`) | ✓ | ✓ | ✓ |
| التحليلات | ✓ | ✓ | ✗ |
| التصميم (`design.update`) | ✓ | ✗ | ✗ |
| QR (`qr.manage`) | ✓ | ✗ | ✗ |
| الفريق (`staff.manage`) | ✓ | ✗ | ✗ |
| الاشتراك (`subscription.manage`) | ✓ | ✗ | ✗ |

### 6.3 الحراس (Guards)

- `lib/auth/session.ts` — قراءة الجلسة والملف الشخصي.
- `lib/auth/guards.ts` / `authorization.ts` — `requirePlatformAdmin(next)`، `requireRestaurantAccess(permission)`، `getTenantContext()`.
- `getTenantContext` يحدد المطعم الحالي: من عضويات المستخدم + كوكي `mh-restaurant-id`.
- المستخدم بلا مطعم مفعّل → يُحوَّل إلى `/onboarding` (شاشة "بانتظار التفعيل").
- الأدمن يدخل لوحة أي مطعم عبر `?restaurant=<id>`.
- `forbidden()` ← صفحة `forbidden.tsx`.

### 6.4 تدفق التسجيل والدخول

1. **/register** → `registerUser` ينشئ مستخدم Supabase؛ trigger `on_auth_user_created` ينشئ صف `profiles`.
2. **/verify-email** — شاشة تأكيد البريد.
3. **/auth/callback** (route handler) يبدّل الـ `code` بجلسة ويحوّل إلى `next`.
4. **/login** → `loginUser`؛ ثم `/onboarding` الذي يوجّه: أدمن→`/admin`، مفعّل→`/dashboard`، غير ذلك→ شاشة انتظار.
5. **استعادة كلمة المرور**: `/forgot-password` (إرسال الرابط، ردّ موحّد لا يكشف وجود البريد) ثم `/reset-password` (`updateUser`، ٨ أحرف كحد أدنى).
6. مسارات `/auth/login|register|forgot-password|reset-password|verify-email` مجرد **aliases** تحوّل للمسارات الأساسية.

---

## 7. خريطة الصفحات الكاملة

### 7.1 عامة

| المسار | الوصف |
|---|---|
| `/` | الصفحة التسويقية: عرض المنتج، روابط الـ demo (`/m/demo`, `/m/demo-cars`)، دعوة للتسجيل |
| `/m/[slug]` | **المنيو العام** للمستأجر (ISR/ديناميكي حسب الحالة). مع `loading` و`error` و`not-found` خاصة |
| `/login` · `/register` · `/forgot-password` · `/reset-password` · `/verify-email` | مجموعة `(auth)` داخل `AuthFrame` |
| `/auth/callback` | Route Handler لتبادل الـ code |
| `/onboarding` | موجّه + شاشة انتظار التفعيل (`pending-access`) |
| `/onboarding/completed` | صفحة اكتمال |
| `/forbidden` · `not-found` · `error` · `loading` | صفحات النظام |

### 7.2 لوحة المطعم `/dashboard` (مجموعة `(dashboard)`)

| المسار | الشاشة | الصلاحية |
|---|---|---|
| `/dashboard` | نظرة عامة: 4 بطاقات (مشاهدات المنيو/المنتجات/مسح QR/المشاركات)، إجراءات سريعة، النشاط الأخير، بطاقة حالة المنيو (نشر/إلغاء نشر)، رابط المنيو | عضو |
| `/dashboard/menu` | نظرة عامة على المنيو (أقسام + منتجات) | `menu.view` |
| `/dashboard/menu/categories` | إدارة الأقسام: إنشاء/تعديل/تفعيل/حذف/ترتيب/صورة | EDITOR+ (الحذف MANAGER+) |
| `/dashboard/menu/products` | قائمة المنتجات: بحث/فلترة/تكرار/ترتيب/حذف/تغيير حالة | EDITOR+ |
| `/dashboard/menu/products/new` | محرّر منتج جديد | EDITOR+ |
| `/dashboard/menu/products/[id]/edit` | تعديل منتج + معرض صور + مجموعات خيارات | EDITOR+ |
| `/dashboard/menu/options` | إدارة مجموعات الخيارات والإضافات | `options.manage` |
| `/dashboard/design` | التصميم: معرض ثيمات + مخصّص ألوان/خط/CSS + معاينة حيّة | OWNER |
| `/dashboard/qr` | توليد QR وتنزيله وتخصيصه | OWNER |
| `/dashboard/analytics` | تحليلات المنيو (فترات، رسوم، حركة المرور) | OWNER/MANAGER |
| `/dashboard/restaurant` | صفحة "النشاط": ثلاث بطاقات روابط إلى الإعدادات العامة وساعات العمل وروابط التواصل | `restaurant.update` (OWNER/MANAGER) |
| `/dashboard/restaurant/settings` | بيانات المطعم، الشعار، الغلاف، الرابط (slug)، واتساب، العملة، إعدادات الطلب والشات | OWNER/MANAGER |
| `/dashboard/restaurant/hours` | ساعات العمل لكل يوم | OWNER/MANAGER (حسب حارس الصفحة) |
| `/dashboard/restaurant/social` | روابط التواصل الاجتماعي | OWNER/MANAGER (حسب حارس الصفحة) |
| `/dashboard/staff` | الفريق: عرض/دعوة/تغيير دور/تعطيل | OWNER |
| `/dashboard/settings` | الإعدادات: تبويبات (الحساب، بيانات النشاط، الأمان، الإشعارات) | عضو |
| `/dashboard/subscription` | يحوّل إلى `/dashboard` (الصفحة معطّلة عملياً) | — |

### 7.3 لوحة الأدمن `/admin`

| المسار | الوصف |
|---|---|
| `/admin` | لوحة عامة: إحصاءات المنصة (مطاعم، مستخدمون، مشاهدات...) |
| `/admin/restaurants` | قائمة كل المطاعم: إنشاء/تفعيل/تعليق/تغيير الخطة/دخول للوحة المطعم/زرع منيو تجريبي |
| `/admin/users` | قائمة المستخدمين: تعديل الدور، تفعيل/تعطيل، ربط مستخدم بمطعم |
| `/admin/finance` | **الوحدة المالية**: العقود، الخصومات، الأقساط، التجديد، الربح |
| `/admin/settings` | إعدادات المنصة (`platform_settings`) |
| `/admin/payments` · `/admin/plans` · `/admin/subscriptions` · `/admin/analytics` | تحوّل إلى `/admin` (غير منفّذة) |

مع `layout` يحمي بـ `requirePlatformAdmin`، و`error`/`loading`/`not-found` خاصة.

### 7.4 API

| المسار | الوظيفة |
|---|---|
| `POST /api/upload` | رفع صورة: يتحقق من الجلسة، ≤ 5MB، يحسّنها (sharp→WebP)، يرفعها إلى R2 بمفتاح `{folder}/{userId}/{uuid}.webp` ويرجع الرابط |
| `GET /auth/callback` | تبادل الكود بجلسة |

---

## 8. تفصيل الميزات

### 8.1 المنيو العام (`/m/[slug]`)

يعتمد على `getPublicMenu` الذي يستدعي RPC `restaurant_public_state` ويحدد الحالة:
`demo` (كتالوج ثابت) · `not_found` · `suspended/inactive` · `unpublished` · `ready`.

**المكوّنات** (`components/public-menu/*`):
- **Hero**: غلاف + شعار + اسم + وصف.
- **تنقّل الأقسام**: شريط قابل للسحب مع أسهم، "الكل" + أقسام بصورها (صورة القسم أو أول منتج).
- **بحث** داخل المنتجات.
- **بطاقة المنتج** (`product-card`) بصورة محسّنة `@640`، سعر، سعر سابق مشطوب، شارة "مميز".
- **نافذة المنتج** (`product-modal`): معرض صور، وصف، **مجموعات الخيارات** (اختيار واحد/متعدد، إلزامي، حد أدنى/أقصى، فرق سعر لكل خيار).
- **السلة** (`cart-sheet`) وشريط سفلي (`bottom-nav`).
- **ورقة الطلب** (`order-sheet`): بيانات العميل حسب نوع الطلب.
- **المشاركة** (`share-menu`): نسخ الرابط/مشاركة النظام.
- **الشات** (`chat`).
- **الفوتر**: روابط التواصل + "Powered by MenuHub" (`removeBranding` مُمرَّر كـ false دائماً — لا يُربط بالخطة).
- **نصوص حسب نوع النشاط** (`lib/business-type.ts`): "طاولة" للمطعم/الكافيه، "توصيل/استلام" للمتجر، إلخ.

**الثيم**: ألوان (`primary/secondary/background/text`) وخط تُطبَّق كـ CSS variables/inline. حقل `custom_css` يُطبَّق في **معاينة اللوحة فقط** (`@scope`) ولا يُطبَّق على المنيو العام.

### 8.2 الطلب عبر واتساب

1. العميل يضيف منتجات + خيارات للسلة (حالة محلية).
2. يختار نوع الطلب (داخل المطعم/استلام/توصيل... حسب `business_type` والإعدادات المفعّلة) ويدخل البيانات (طاولة/اسم/هاتف/عنوان/ملاحظات).
3. `lib/order-invoice.ts` يبني **فاتورة نصية** عربية (البنود، الخيارات، المجموع، العملة).
4. `lib/phone.ts` يطبّع رقم واتساب المطعم؛ يُفتح `https://wa.me/{number}?text=...`.
5. **لا يُخزَّن أي شيء** في قاعدة البيانات.

### 8.3 الشات بوت (`actions/public/askMenuChat.ts` + `lib/menu-chat.ts`)

- يعمل فقط إذا كان مفعّلاً في إعدادات المطعم (أعمدة من migration `00014`).
- **تحديد المعدل** داخل الذاكرة (in-memory) لكل slug.
- **تعقيم المدخلات** وتقطيع الطول.
- يبني سياقاً من المنيو (أقسام/منتجات/أسعار/ساعات العمل) ويرسله لـ LLM؛ وعند غياب المفتاح أو فشل الاتصال → **رد احتياطي بقواعد** (أسئلة عن السعر، التوفر، الأقسام، الساعات، الاقتراحات) بالعربية.

### 8.4 الأقسام والمنتجات والخيارات

- **أقسام**: `name_ar` مطلوب، `name_en`، وصف ثنائي، صورة، ترتيب، حالة (`is_active`).
- **منتجات**: اسم ووصف (ar/en)، سعر، سعر سابق ("يظهر مشطوباً عند وجود خصم")، تصنيف، حالة (`AVAILABLE/UNAVAILABLE/...`)، ترتيب، **منتج مميز**، صورة رئيسية + معرض (`product_images`).
- **مجموعات الخيارات** (`product_option_groups`) وخياراتها (`product_options`): نوع (`SINGLE/MULTIPLE`)، إلزامي، `min_selection`، `max_selection` (فارغ=بلا حد)، ترتيب؛ وللخيار فرق سعر وحالة.
- عمليات إضافية: **تكرار منتج** (`duplicateProduct`)، **إعادة ترتيب** (`reorderProducts`)، **تغيير حالة**، **حذف**.
- مجموعات الخيارات تُدار من صفحة المنتج (بعد إنشائه) ومن `/dashboard/menu/options`.

### 8.5 التصميم (`/dashboard/design`)

- `ThemeGallery` لاختيار ثيم جاهز (`themes`).
- `ThemeCustomizer`: ألوان، خط، CSS مخصص.
- `LiveMenuPreview`: معاينة حيّة داخل الصفحة.
- يُحفظ في `restaurant_themes` (صف واحد لكل مطعم). **اختيار `theme_id` لا يغيّر الألوان تلقائياً**؛ القيم المخصصة هي المعتمدة.
- الخط: فقط **ExpoArabic** محمّل فعلياً؛ بقية الخطوط في القائمة لا تُحمَّل.

### 8.6 QR (`/dashboard/qr`)

- `createQrCode` يخزّن الإعدادات (لون، حجم، شعار...)، والصورة تُولَّد عبر `api.qrserver.com`.
- يحمّل المستخدم PNG/SVG. خيار "الشعار في المنتصف" **شكلي** (لا يُدمج فعلياً).
- `QR_SCAN` معرَّف كحدث لكن **لا يُرسل أي كود** هذا الحدث، لذا عدّاد مسح QR يبقى 0.

### 8.7 التحليلات

| الحدث | يُرسل؟ | المصدر |
|---|:-:|---|
| `MENU_VIEW` | ✓ | فتح المنيو |
| `PRODUCT_VIEW` | ✓ | فتح نافذة منتج |
| `SHARE` | ✓ | زر المشاركة |
| `SEARCH` | ✗ | معرَّف فقط |
| `QR_SCAN` | ✗ | معرَّف فقط |

- `createAnalyticsEvent` **عام** (anon insert) ويخزّن `visitor_id` اختيارياً.
- `getDashboardStats` يحسب العدّادات من الأحداث؛ `getAnalyticsEvent` يجلب للرسوم (`analytics-overview`, `traffic-chart`).
- لوحة الأدمن العامة تعرض إجماليات المنصة.

### 8.8 ساعات العمل والتواصل

- `business_hours`: صف لكل يوم (وقت فتح/إغلاق/مغلق). تُستخدم في الشات بوت؛ **لا تظهر كـ"مفتوح/مغلق" في المنيو العام**.
- `social_links`: منصات (`SOCIAL_PLATFORMS` في `components/lib/labels.ts`) مع أيقونات وألوان، `socialHref` يبني الرابط الصحيح لكل منصة.

### 8.9 الفريق (`staff.ts`)

- عرض الأعضاء، دعوة مستخدم **موجود بالبريد** (يبحث بـ `listUsers` حتى 1000)، تغيير الدور، تفعيل/تعطيل. للـ OWNER فقط.
- لا يوجد نظام دعوات عبر بريد لمستخدم غير مسجّل.

### 8.10 الإعدادات

`settings-view`: تبويبات **الحساب** (الاسم، الهاتف)، **بيانات النشاط**، **الأمان**، **الإشعارات**. نظام الإشعارات (`notification-bell`) يقرأ من جدول `notifications` لكن **لا يوجد كود ينشئ إشعارات**.

### 8.11 لوحة الأدمن

**المطاعم** (`actions/admin/admin.ts`):
- `adminCreateRestaurant` (يُنشئ المطعم + المنيو الافتراضي + الثيم + الاشتراك + ربط المالك).
- `adminSetRestaurantStatus` (`ACTIVE/TRIAL/SUSPENDED/...`)؛ **التفعيل ينشر المنيو تلقائياً** (`menu_status = PUBLISHED`).
- `adminChangePlan`، دخول اللوحة بـ `?restaurant=`.
- `seedDemoMenu`: يزرع كتالوج `demo` أو `demo-cars` في قاعدة البيانات لمطعم محدد.

**المستخدمون**: تعديل `platform_role`، تفعيل/تعطيل، ربط بمطعم بدور.

**الإعدادات** (`platform_settings`): مفاتيح/قيم عامة.

**المالية** (`actions/admin/finance.ts`, `lib/menu-billing.ts`, `save-menu-billing.ts`, جداول `menu_billings` و`menu_installments`):
- عقد لكل مطعم: سعر العقد، **خصم** (مبلغ/نسبة)، **صافي السعر**، **تكلفة الإعداد** (`setup_cost`)، **أقساط** (عدد/تواريخ/مبالغ/حالة دفع)، **تجديد سنوي**.
- **صافي الربح = صافي السعر − `setup_cost`**.
- واجهة: `admin-finance-view`, `menu-billing-fields`، جداول وفلاتر ومؤشرات.
- RLS: للأدمن فقط.

### 8.12 نظام الصور

مسار الرفع: `uploadImageFile` (عميل) → `/api/upload` → `optimize-image` (حد أقصى للأبعاد، تحويل WebP) → `r2.ts` (S3 PutObject) → رابط عام.
- مفتاح الكائن: `{folder}/{userId}/{uuid}.webp`.
- `image-objects.ts`: تحليل/تحقق من المفاتيح والروابط (12 اختباراً).
- `image-sizes.ts`/`image-display.ts`: متغير **`@640`** لبطاقات المنتجات.
- `storage.ts` (`parseStoredImageUrl`): يتحقق أن الرابط المخزّن يعود لمصدر مسموح (R2/Supabase) قبل حفظه.
- `ContentImage` مكوّن عرض موحّد (fallback + lazy).
- التحقق: أي مستخدم **مسجّل** يمكنه الرفع (لا فحص عضوية مطعم)، الحد 5MB.

### 8.13 الـ Demo

- `lib/demo-catalog.ts` يعيد الكتالوج الثابت لـ `demo` (مطعم **"بيت الشام"**، ~20 صورة منتج) و`demo-cars` (معرض **"أوتو الشام"**، ~19 سيارة).
- يُخدَم **بدون قاعدة بيانات** عند طلب `/m/demo` أو `/m/demo-cars`، ويمكن زرعه في DB عبر `seedDemoMenu`.
- `/public/images/**` مُتجاهل في git.

---

## 9. قاعدة البيانات (Supabase / Postgres)

المرجع: `schame.md` + migrations `00014–00016`. (ملاحظة: الـ migrations `00002–00013` المذكورة في المرجع **غير موجودة** في المستودع.)

### 9.1 Enums (أهمها)
`platform_role`, `restaurant_role`, `restaurant_status`, `menu_status`, `business_type`, `product_status`, `option_selection_type`, `subscription_status`, `analytics_event_type`, ...

### 9.2 الجداول الرئيسية (24+)

| المجموعة | الجداول |
|---|---|
| الهوية | `profiles`, `restaurants`, `restaurant_users` |
| المحتوى | `menus`, `categories`, `products`, `product_images`, `product_option_groups`, `product_options` |
| المظهر | `themes`, `restaurant_themes` |
| التشغيل | `business_hours`, `social_links`, `branches`, `custom_domains`, `qr_codes` |
| الأعمال | `plans`, `subscriptions`, `invoices`, `payments` |
| النظام | `analytics_events`, `notifications`, `audit_logs`, `platform_settings`, `reserved_subdomains` |
| المالية (migrations) | `menu_billings`, `menu_installments` |

أعمدة الشات والطلب في `restaurants` (`00014`)، و`setup_cost` (`00016`).

### 9.3 الدوال/Triggers
- `on_auth_user_created` → إنشاء `profiles`.
- `*_updated_at` لتحديث `updated_at`.
- `restaurants_protect_business_type` → يمنع تغيير `business_type`.
- دوال مساعدة: `is_platform_admin()`, `user_restaurant_ids()`، وRPC `restaurant_public_state`.

### 9.4 RLS (ملخّص)
- القراءة العامة للمنيو المنشور (مطاعم/قوائم/أقسام/منتجات/خيارات/ثيمات/روابط).
- الأعضاء يديرون بحسب الدور؛ الأدمن يدير كل شيء.
- `analytics_events`: إدخال عام.
- `menu_billings`/`menu_installments`: أدمن فقط.
- `reserved_subdomains`: قراءة عامة.
- Seeds: الخطط، الثيمات، النطاقات المحجوزة. و Bucket `images` (إرث من قبل R2).

---

## 10. فهرس الـ Server Actions (`src/actions`)

| المجلد | أهم الدوال | ملاحظات |
|---|---|---|
| `auth/` | `loginUser`, `registerUser`, `logoutUser`, `forgotPassword`, `resetPassword` | |
| `admin/` | `admin.ts`, `finance.ts`, `seedDemoMenu.ts` | كلها تتطلب أدمن منصة |
| `restaurants/` | `bootstrapRestaurant`, `updateRestaurant`, `setCurrentRestaurant`, `updateRestaurantStatus` | الأخيرة غير مستخدمة |
| `catalog/` | `getCatalog` | تحميل الأقسام/المنتجات للوحة |
| `categories/` | create/update/updateStatus/delete | |
| `products/` | create/update/updateStatus/duplicate/reorder/delete | |
| `product-images/` | create/update/delete | |
| `product-option-groups/`, `product-options/` | create/update/updateStatus/delete | |
| `menus/` | `createMenu`, `updateMenu`, `updateMenuStatus`, `getMenu` | |
| `restaurant-themes/` | create/update/get | |
| `qr-codes/` | create/update/delete/get | تحقق عضوية فقط |
| `business-hours/`, `social-links/` | CRUD + status | تحقق عضوية فقط |
| `staff/` | list/invite/updateRole/updateStatus | OWNER |
| `restaurant-users/` | CRUD | غير مستخدمة في الواجهة |
| `analytics/` | `createAnalyticsEvent`, `getAnalyticsEvent` | |
| `dashboard/` | `getDashboardStats` | |
| `public/` | `getPublicMenu`, `askMenuChat` | بلا مصادقة |
| `reserved-subdomains/` | `checkSlugAvailable` | |
| `upload/` | `uploadImage` | |
| `subscriptions/`, `invoices/`, `payments/`, `plans/`, `branches/`, `custom-domains/`, `notifications/`, `audit-logs/` | CRUD كامل | **معظمها بلا واجهة** |

---

## 11. الاختبارات

- `src/lib/image-objects.test.ts` (12 اختباراً) — تحليل مفاتيح/روابط الصور.
- `src/lib/optimize-image.test.ts` (2 اختبار) — التحسين والتحويل.
- التشغيل: `npm test` (= `tsx --test ...`). لا توجد اختبارات للـ Actions أو الواجهات أو RLS.

---

## 12. الكود غير المستخدم / غير المكتمل

- Actions بلا واجهة: `branches`, `custom-domains`, `subscriptions`, `invoices`, `payments`, `plans`, `restaurant-users`, `audit-logs`, `notifications`, `updateRestaurantStatus`.
- `OnboardingWizard` (7 خطوات: مطعم، رابط، تصميم، شعار، قسم، منتج، نشر) موجود **لكن غير موصول** في المسار الحالي (بسبب نموذج التزويد من الأدمن).
- صفحات الأدمن `payments/plans/subscriptions/analytics` تحوّل للرئيسية.
- `/dashboard/subscription` يحوّل للرئيسية.
- الأحداث `SEARCH` و`QR_SCAN` معرّفة وتظهر في الرسوم لكنها لا تُرسَل.
- `custom_css` يُحفظ لكنه لا يُطبّق على المنيو العام.
- `remove_branding` في الخطة لا يؤثر على المنيو (Footer دائماً يعرض العلامة).
- حدود الخطط (عدد المنتجات/الفروع...) **غير مفروضة**.
- سجل التدقيق والإشعارات: جداول وواجهات عرض بلا أي كود يكتب فيها (لذلك "النشاط الأخير" فارغ دائماً).
- خيار شعار QR شكلي.
- خطوط غير ExpoArabic لا تُحمَّل.

---

## 13. مخاطر وملاحظات تقنية

> مبنية على قراءة `schame.md` والكود. تحقق منها على قاعدة البيانات الحية لأن migrations `00002–00013` غير موجودة محلياً.

### أمنية (أولوية عالية)
1. **تصعيد صلاحيات عبر `profiles`**: سياسة "Users can update own profile" تسمح بتحديث الصف كاملاً (`id = auth.uid()`) دون تقييد الأعمدة، ولا يوجد trigger يحمي `platform_role` (على عكس `business_type`). مستخدم عادي يستطيع نظرياً — عبر REST مباشرة بمفتاحه العام — تحويل نفسه إلى `SUPER_ADMIN`. **يلزم trigger أو تقييد أعمدة.**
2. **تجاوز التفعيل**: سياسة تحديث `restaurants` للـ OWNER/MANAGER بلا تقييد أعمدة → يمكنهم تعديل `status`/`menu_status` مباشرة وتخطي تفعيل الأدمن. كذلك سياسات `subscriptions` تسمح للمالك بتغيير الخطة.
3. **`restaurant_users`**: المالك يستطيع (عبر السياسة) إضافة أي `user_id` بأي دور.
4. **`/api/upload`**: أي مستخدم مسجّل يرفع إلى R2 (لا ربط بمطعم/حصة) → مخاطر استهلاك تخزين.
5. **`analytics_events`** و**الشات**: إدخال/استدعاء عام؛ تحديد المعدل للشات في الذاكرة فقط (يتصفّر مع كل instance ولا يعتمد IP).
6. `getTenantContext` يعتبر العضو بلا صف عضوية (مثل أدمن بكوكي) بدور **OWNER** ضمنياً — مقبول كـ"انتحال إداري" لكنه يحتاج توثيقاً.

### اتساق الصلاحيات
- الصفحة تشترط `design.update`/`qr.manage` للـ OWNER فقط، بينما الـ Actions تسمح لـ MANAGER (للتصميم) ولأي عضو (للـ QR/الساعات/الروابط). يُفضَّل توحيد الفحص عبر `permissions.ts`.

### أداء/قابلية توسع
- دعوة الموظفين بـ `listUsers(perPage:1000)` لا تتوسع.
- لا يوجد caching لـ `getCatalog` سوى revalidate.

### فجوات وظيفية مقابل الـ PRD
تسجيل ذاتي بإنشاء مطعم، دفع/فوترة فعلية للاشتراكات، فروع، نطاقات مخصصة، تخزين الطلبات، إشعارات، سجل تدقيق، تعدد اللغات في الواجهة العامة (الحقول `*_en` موجودة والعرض عربي فقط)، حالة "مفتوح/مغلق" في المنيو.

---

## 14. تدفقات رئيسية

**إنشاء مطعم جديد**
```
مستخدم يسجّل → profiles(USER)
أدمن /admin/restaurants → adminCreateRestaurant
   → restaurants + menus + restaurant_themes + subscriptions + restaurant_users(OWNER)
أدمن يفعّل → status=ACTIVE/TRIAL + menu_status=PUBLISHED
المالك يدخل /onboarding → /dashboard
```

**زيارة المنيو**
```
https://slug.root → proxy rewrite → /m/slug
getPublicMenu → restaurant_public_state → catalog → PublicMenu
MENU_VIEW → analytics_events
سلة → order-invoice → wa.me
```

**رفع صورة**
```
اختيار ملف → uploadImageFile → POST /api/upload
→ auth → حد 5MB → sharp WebP → R2 → URL
→ parseStoredImageUrl عند حفظها في الجداول
```

---

## 15. التشغيل

```bash
npm install
cp .env.example .env.local   # املأ القيم
npm run dev                  # يعمل مع --max-http-header-size=131072
npm test                     # اختبارات الصور
npm run lint
```
- تطبيق المخطط: نفّذ `schame.md` ثم migrations `00014 → 00016` على Supabase.
- أنشئ أول أدمن بتعديل `profiles.platform_role` يدوياً.
- للنطاقات الفرعية محلياً استخدم `slug.localhost:3000` أو المسار الاحتياطي `/m/slug`.

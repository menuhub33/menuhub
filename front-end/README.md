# MenuHub — Front-end (Next.js 16)

واجهة المشروع مبنية بمعمارية **modular** وتتصل بـ API الـ Laravel الموجود في `../back-end` (`/api/v1`) بدلاً من Supabase.

## التشغيل

```bash
cp .env.example .env.local     # عدّل API_URL عند الحاجة
npm install
npm run dev                    # http://localhost:3000
```

يجب أن يعمل الـ back-end (`php artisan serve`) وأن يكون `FRONTEND_URL` فيه مساوياً لعنوان هذه الواجهة (CORS وروابط البريد).

| أمر | الوظيفة |
| --- | --- |
| `npm run dev` / `build` / `start` | تشغيل / بناء / خدمة الإنتاج |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## المتغيّرات

| المتغير | الوصف |
| --- | --- |
| `API_URL` | عنوان الـ API (من جهة الخادم فقط). الافتراضي `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | عنوان الواجهة. تفعيل حلّ النطاقات المخصصة في `proxy.ts` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | النطاق الجذر لـ `{slug}.domain.com` |
| `MEDIA_PUBLIC_URL` | (اختياري) CDN للصور لإضافته إلى `next/image` |

## البنية

```
src/
├─ app/                  # المسارات فقط (صفحات رفيعة تستدعي modules)
├─ proxy.ts              # حماية المسارات + النطاقات الفرعية/المخصصة
├─ core/                 # كل ما هو مشترك
│  ├─ api/               # عميل الـ API، ActionResult، الإعدادات
│  ├─ auth/              # الجلسة، التوكن، الصلاحيات، حراس الوصول
│  ├─ ui/ components/    # مكوّنات الواجهة المشتركة
│  └─ lib/ config.ts providers.tsx
└─ modules/              # موديول لكل مجال (يطابق موديولات الـ back-end)
   ├─ auth  tenancy  catalog  theming  operations  media
   ├─ billing  finance  analytics  audit  notifications
   └─ storefront  chatbot  platform
      └─ actions/ components/ views/ lib/ types.ts
```

قاعدة الاعتماد: `app → modules → core`. الموديولات لا تستورد من `app`.

## كيف يتصل بالـ back-end (BFF)

- كل الاستدعاءات تمر عبر **Server Actions** (`modules/*/actions`) التي تُرجع `ActionResult<T>` (`{data, error}`).
- توكن Sanctum يُحفظ في كوكي `mh_token` (httpOnly، 30 يوماً) ولا يصل للمتصفح. `core/api/client.ts` يضيفه إلى كل طلب.
- المطعم الحالي يُحفظ في كوكي `mh-restaurant-id` ويُتحقق منه مقابل `GET /me/restaurants`.
- انتهاء/رفض التوكن يحوّل إلى `/auth/expired` الذي يمسح الكوكي ويعيد إلى `/login`.
- رفع الصور: `POST /api/upload` (route handler) يمرّر الملف إلى `POST /uploads` مع `restaurant_id`.
- الصلاحيات في `core/auth/permissions.ts` للعرض فقط؛ الـ back-end هو من يطبّق الصلاحيات فعلياً.

## ملاحظات سلوكية مقارنةً بنسخة Supabase

- التسجيل ينشئ حساباً فقط؛ المطعم تنشئه الإدارة (`/admin/restaurants`).
- ساعات العمل تُحفظ للأسبوع كاملاً بطلب واحد.
- رابط QR يولّده الـ back-end ويتتبّع المسح (`QR_SCAN`).
- إضافة موظف جديد (بريد بلا حساب) تحتاج الاسم وكلمة مرور مؤقتة.
- لا يوجد تنظيف تلقائي للصور اليتيمة بعد حذف المنتج.

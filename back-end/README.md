# MenuHub API (Laravel, modular)

REST API for the MenuHub Next.js app, built from the reverse-engineering notes in `../ENG.MD`.
Laravel 13 · PHP 8.3+ · Sanctum bearer tokens · **MySQL** database (tests run on in-memory SQLite).

```bash
cp .env.example .env && php artisan key:generate
# create the database once:  CREATE DATABASE menuhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# then set DB_HOST / DB_PORT / DB_DATABASE / DB_USERNAME / DB_PASSWORD in .env
php artisan migrate --seed          # plans, themes, reserved slugs, demo menus, super admin (from .env)
php artisan serve                   # http://localhost:8000/api/v1
php artisan test                    # 52 feature tests (SQLite in memory)
```

Set `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` before seeding to get the first platform admin.
`php artisan menuhub:seed-demo [demo|demo-cars]` rebuilds the sample menus.

## Modular architecture

Each module lives in `modules/{Name}` and is switched on in `config/modules.php`.
A module is wired purely by convention (`Shared\Support\ModuleServiceProvider`):

```
modules/{Name}/
  Providers/{Name}ServiceProvider.php   # extends ModuleServiceProvider
  Database/Migrations | Seeders
  Routes/api.php                        # mounted under /api/v1
  Http/Controllers | Resources | Middleware
  Models | Services | Listeners | Support
  Tests/
```

| Module | Responsibility |
| --- | --- |
| Shared | enums, base classes, events, plan-limit contract, rate limiters |
| Users, Auth | accounts, Sanctum tokens, password reset, e-mail verification |
| Tenancy | restaurants, memberships, RBAC (`Permissions`), tenant middleware, slugs |
| Catalog | menus, categories, products, images, option groups |
| Theming, Operations | themes, social links, branches, hours, QR codes, custom domains |
| Media | validated image upload (local disk or Cloudflare R2) |
| Billing | plans, subscriptions, invoices, payments, `PlanLimiter` |
| Finance | admin contracts, discounts, installments, renewals, profit |
| Analytics | public events, dashboard, summaries |
| Storefront | cached public menu state machine |
| Chatbot | catalog assistant (rule based, optional OpenAI-compatible LLM) |
| Platform | admin provisioning, status, stats, settings, demo data |
| Audit, Notifications | audit log and in-app notifications, fed by events |

Modules never reach into each other's internals. They talk through:

- **Events** in `Shared\Events`: `ActivityRecorded` (Audit), `RestaurantContentChanged` (Storefront cache), `RestaurantStatusChanged` (Notifications).
- **Contracts**: `Shared\Contracts\EnforcesPlanLimits`, bound by Billing and used by Catalog, Operations and Tenancy.
- **Relations** added with `resolveRelationUsing` from the owning module's provider.

## API overview

Base URL `/api/v1`, JSON only, successful payloads wrapped in `{ "data": ... }`, errors in Arabic.
Authenticate with `Authorization: Bearer <token>` from `POST /auth/login`.

- **Public**: `GET /public/menus/{slug}`, `POST /public/menus/{slug}/events`, `POST /public/menus/{slug}/chat`, `GET /public/resolve-host?host=`, `GET /plans`, `GET /themes`, `GET /slugs/check`
- **Auth**: `/auth/register|login|logout|me|password|forgot-password|reset-password|email/*`
- **Tenant** (`/restaurants/{id}/...`): `dashboard`, `catalog`, `menus`, `categories`, `products`, `product-images`, `option-groups`, `options`, `theme`, `social-links`, `branches`, `business-hours`, `qr-codes`, `custom-domains`, `staff`, `analytics/*`, `audit-logs`, `subscription`, `invoices`, `payments`; plus `POST /uploads`, `/notifications`, `/me/restaurants`
- **Platform admin** (`/admin/...`): `restaurants`, `users`, `plans`, `subscriptions`, `invoices`, `payments`, `themes`, `reserved-subdomains`, `finance`, `installments`, `stats`, `settings`, `demo/{slug}`

Run `php artisan route:list` for the full list.

## Security fixes over the original app

- Platform role and `is_active` can only be changed through `UserService` by an administrator; only a SUPER_ADMIN can grant or touch admin accounts (the original `profiles` RLS policy let users promote themselves).
- Every tenant route resolves `{restaurant}` first and child records are scope-bound to it, so ids from other tenants return 404.
- Dashboard updates only accept whitelisted columns: owners cannot change `status`, `menu_status` or `business_type`.
- Uploads require membership of the target restaurant, validate real image content, and only delete the caller's own files.
- Public analytics resolve the restaurant from the slug and ignore ids that belong to another tenant; chat and events are rate limited.
- Custom CSS is sanitised and custom domains are verified through a DNS TXT record (`_menuhub.{domain}` = `menuhub-verify={token}`).
- Admin provisioning runs in one DB transaction instead of manual rollbacks.

## Notes

- Plan limits are enforced when `ENFORCE_PLAN_LIMITS=true`; restaurants without a live subscription fall back to the `free` plan.
- Image optimisation (WebP, resizing) needs the PHP GD extension; without it the validated original is stored as-is.
- Uploaded images go to Cloudflare R2 (`MEDIA_DISK=r2`). Fill the `R2_*` variables in `.env`; the front-end needs the same public base in `MEDIA_PUBLIC_URL`.

-- =========================================================
-- MENUHUB — Canonical database schema (source of truth)
-- PostgreSQL / Supabase
-- =========================================================
--
-- This file is the reference for tables, enums, functions, RLS,
-- storage, and seeds that the app actually uses.
--
-- How to apply
--   Fresh project: run this file in the SQL Editor, then run
--   supabase/migrations in order (00002 → latest). Later
--   migrations are written with IF EXISTS / CREATE OR REPLACE
--   so they stay safe after this baseline.
--
--   Existing project: do not re-run this whole file. Apply any
--   missing files in supabase/migrations instead.
--
-- Product rules encoded here
--   - Tenant table is public.restaurants (مطعم / كافيه / محل).
--   - Only platform admins create tenants and owner accounts.
--   - business_type is set by admins only (trigger-enforced).
--   - Public menu is readable when restaurant + menu are PUBLISHED
--     and status is TRIAL or ACTIVE.
--   - Images live in the public storage bucket "images".
--
-- Incremental patches live in supabase/migrations/:
--   00002 public menu + admin RLS
--   00003 membership select (no recursion)
--   00004 admin-only tenant provisioning
--   00005 seed SUPER_ADMIN (edit credentials first)
--   00006 / 00008 images bucket
--   00007 admin_create_owner_account
--   00009 public branches
--   00010 delivery_enabled
--   00011 business_type (varchar; 00013 converts to enum)
--   00012 protect business_type (admin-only)
--   00013 align live DB with this file
--   00014 public menu chatbot settings
-- Do not put secrets or production admin passwords in this file.
-- =========================================================

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- 2. ENUMS
-- =========================================================

create type public.platform_role as enum (
    'USER',
    'ADMIN',
    'SUPER_ADMIN'
);

create type public.restaurant_status as enum (
    'TRIAL',
    'ACTIVE',
    'SUSPENDED',
    'EXPIRED',
    'CANCELLED'
);

create type public.menu_status as enum (
    'DRAFT',
    'PUBLISHED',
    'UNPUBLISHED'
);

create type public.restaurant_role as enum (
    'OWNER',
    'MANAGER',
    'EDITOR'
);

create type public.product_status as enum (
    'AVAILABLE',
    'UNAVAILABLE',
    'HIDDEN'
);

create type public.option_selection_type as enum (
    'SINGLE',
    'MULTIPLE'
);

create type public.subscription_status as enum (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'EXPIRED',
    'CANCELLED'
);

create type public.payment_status as enum (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);

create type public.domain_status as enum (
    'PENDING',
    'VERIFYING',
    'ACTIVE',
    'FAILED',
    'DISABLED'
);

create type public.event_type as enum (
    'MENU_VIEW',
    'PRODUCT_VIEW',
    'SEARCH',
    'QR_SCAN',
    'SHARE'
);

create type public.business_type as enum (
    'RESTAURANT',
    'CAFE',
    'SHOP'
);


-- =========================================================
-- 3. PROFILES
-- Connected to Supabase auth.users
-- =========================================================

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    full_name varchar(150),

    phone varchar(50),

    avatar_url text,

    platform_role public.platform_role
        not null default 'USER',

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 4. RESTAURANTS
-- Tenant table: one row per business (مطعم / كافيه / محل تجاري).
-- Created by platform admins only. Owners manage content after activation.
-- =========================================================

create table public.restaurants (
    id uuid primary key default gen_random_uuid(),

    name varchar(150)
        not null,

    slug varchar(100)
        not null unique,

    description text,

    phone varchar(50),

    whatsapp varchar(50),

    email varchar(255),

    logo_url text,

    cover_image_url text,

    address text,

    latitude numeric(10,7),

    longitude numeric(10,7),

    timezone varchar(100)
        not null default 'Asia/Damascus',

    default_language varchar(10)
        not null default 'ar',

    currency varchar(10)
        not null default 'SYP',

    -- Admin activates to TRIAL/ACTIVE. Owners cannot self-provision.
    status public.restaurant_status
        not null default 'SUSPENDED',

    menu_status public.menu_status
        not null default 'DRAFT',

    -- Public checkout: hide delivery when false.
    delivery_enabled boolean
        not null default true,

    -- Admin-only. Controls dine-in vs pickup copy on the public menu.
    business_type public.business_type
        not null default 'RESTAURANT',

    -- Public menu assistant. Owners can turn it off per restaurant.
    chatbot_enabled boolean
        not null default true,

    chatbot_name varchar(80),

    chatbot_welcome text,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint restaurants_slug_format
        check (
            slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        )
);

comment on table public.restaurants is
    'Tenant: restaurant, cafe, or shop. Provisioned by platform admins.';

comment on column public.restaurants.delivery_enabled is
    'When false, the public menu hides the delivery option on checkout.';

comment on column public.restaurants.business_type is
    'RESTAURANT | CAFE | SHOP. Set by platform admins only.';

comment on column public.restaurants.chatbot_enabled is
    'When true, the public menu shows a catalog-aware assistant widget.';


-- =========================================================
-- 5. RESTAURANT USERS
-- Users belonging to restaurants
-- =========================================================

create table public.restaurant_users (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    user_id uuid
        not null references public.profiles(id)
        on delete cascade,

    role public.restaurant_role
        not null default 'EDITOR',

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    unique (restaurant_id, user_id)
);


-- =========================================================
-- 6. MENUS
-- =========================================================

create table public.menus (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    name varchar(150)
        not null,

    slug varchar(100)
        not null,

    description text,

    status public.menu_status
        not null default 'DRAFT',

    is_default boolean
        not null default false,

    published_at timestamptz,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    unique (restaurant_id, slug)
);


-- =========================================================
-- 7. CATEGORIES
-- =========================================================

create table public.categories (
    id uuid primary key default gen_random_uuid(),

    menu_id uuid
        not null references public.menus(id)
        on delete cascade,

    name_ar varchar(150)
        not null,

    name_en varchar(150),

    description_ar text,

    description_en text,

    image_url text,

    sort_order integer
        not null default 0,

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 8. PRODUCTS
-- =========================================================

create table public.products (
    id uuid primary key default gen_random_uuid(),

    category_id uuid
        not null references public.categories(id)
        on delete cascade,

    name_ar varchar(200)
        not null,

    name_en varchar(200),

    description_ar text,

    description_en text,

    price numeric(12,2)
        not null,

    old_price numeric(12,2),

    currency varchar(10)
        not null default 'SYP',

    sort_order integer
        not null default 0,

    status public.product_status
        not null default 'AVAILABLE',

    is_featured boolean
        not null default false,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint products_price_positive
        check (price >= 0),

    constraint products_old_price_positive
        check (old_price is null or old_price >= 0)
);


-- =========================================================
-- 9. PRODUCT IMAGES
-- =========================================================

create table public.product_images (
    id uuid primary key default gen_random_uuid(),

    product_id uuid
        not null references public.products(id)
        on delete cascade,

    image_url text
        not null,

    sort_order integer
        not null default 0,

    is_primary boolean
        not null default false,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 10. PRODUCT OPTION GROUPS
-- Example:
-- Size
-- Add-ons
-- =========================================================

create table public.product_option_groups (
    id uuid primary key default gen_random_uuid(),

    product_id uuid
        not null references public.products(id)
        on delete cascade,

    name_ar varchar(150)
        not null,

    name_en varchar(150),

    selection_type public.option_selection_type
        not null default 'SINGLE',

    is_required boolean
        not null default false,

    min_selection integer
        not null default 0,

    max_selection integer,

    sort_order integer
        not null default 0,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    constraint option_group_min_selection
        check (min_selection >= 0),

    constraint option_group_max_selection
        check (
            max_selection is null
            or max_selection >= min_selection
        )
);


-- =========================================================
-- 11. PRODUCT OPTIONS
-- =========================================================

create table public.product_options (
    id uuid primary key default gen_random_uuid(),

    option_group_id uuid
        not null references public.product_option_groups(id)
        on delete cascade,

    name_ar varchar(150)
        not null,

    name_en varchar(150),

    price_delta numeric(12,2)
        not null default 0,

    sort_order integer
        not null default 0,

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 12. THEMES
-- =========================================================

create table public.themes (
    id uuid primary key default gen_random_uuid(),

    name varchar(100)
        not null,

    slug varchar(100)
        not null unique,

    description text,

    preview_image_url text,

    is_active boolean
        not null default true,

    is_premium boolean
        not null default false,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 13. RESTAURANT THEMES
-- Customization for each restaurant
-- =========================================================

create table public.restaurant_themes (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null unique references public.restaurants(id)
        on delete cascade,

    theme_id uuid
        references public.themes(id)
        on delete set null,

    primary_color varchar(20)
        not null default '#000000',

    secondary_color varchar(20)
        not null default '#FFFFFF',

    background_color varchar(20)
        not null default '#FFFFFF',

    text_color varchar(20)
        not null default '#111111',

    font_family varchar(100),

    custom_css text,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 14. SOCIAL LINKS
-- =========================================================

create table public.social_links (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    platform varchar(50)
        not null,

    url text
        not null,

    is_active boolean
        not null default true,

    sort_order integer
        not null default 0,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 15. BRANCHES
-- Future / Business Plan
-- =========================================================

create table public.branches (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    name varchar(150)
        not null,

    slug varchar(100)
        not null,

    phone varchar(50),

    address text,

    latitude numeric(10,7),

    longitude numeric(10,7),

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now(),

    unique (restaurant_id, slug)
);


-- =========================================================
-- 16. BUSINESS HOURS
-- =========================================================

create table public.business_hours (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    branch_id uuid
        references public.branches(id)
        on delete cascade,

    day_of_week smallint
        not null,

    open_time time,

    close_time time,

    is_closed boolean
        not null default false,

    created_at timestamptz
        not null default now(),

    constraint business_hours_day
        check (day_of_week between 0 and 6)
);


-- =========================================================
-- 17. QR CODES
-- =========================================================

create table public.qr_codes (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    branch_id uuid
        references public.branches(id)
        on delete cascade,

    menu_id uuid
        not null references public.menus(id)
        on delete cascade,

    name varchar(150)
        not null,

    qr_url text
        not null,

    logo_enabled boolean
        not null default false,

    format varchar(10)
        not null default 'PNG',

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 18. CUSTOM DOMAINS
-- =========================================================

create table public.custom_domains (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    domain varchar(255)
        not null unique,

    status public.domain_status
        not null default 'PENDING',

    verification_token varchar(255),

    verified_at timestamptz,

    ssl_status varchar(50),

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 19. PLANS
-- =========================================================

create table public.plans (
    id uuid primary key default gen_random_uuid(),

    name varchar(100)
        not null,

    slug varchar(100)
        not null unique,

    description text,

    price_monthly numeric(12,2)
        not null default 0,

    price_yearly numeric(12,2)
        not null default 0,

    currency varchar(10)
        not null default 'USD',

    max_menus integer,

    max_products integer,

    max_branches integer,

    max_staff integer,

    analytics_enabled boolean
        not null default false,

    custom_domain_enabled boolean
        not null default false,

    remove_branding boolean
        not null default false,

    advanced_analytics boolean
        not null default false,

    is_active boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 20. SUBSCRIPTIONS
-- =========================================================

create table public.subscriptions (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    plan_id uuid
        not null references public.plans(id)
        on delete restrict,

    status public.subscription_status
        not null default 'TRIAL',

    starts_at timestamptz
        not null default now(),

    ends_at timestamptz,

    trial_ends_at timestamptz,

    auto_renew boolean
        not null default true,

    created_at timestamptz
        not null default now(),

    updated_at timestamptz
        not null default now()
);


-- =========================================================
-- 21. PAYMENTS
-- =========================================================

create table public.payments (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    subscription_id uuid
        references public.subscriptions(id)
        on delete set null,

    amount numeric(12,2)
        not null,

    currency varchar(10)
        not null default 'USD',

    payment_method varchar(50),

    transaction_id varchar(255),

    status public.payment_status
        not null default 'PENDING',

    paid_at timestamptz,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 22. INVOICES
-- =========================================================

create table public.invoices (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    subscription_id uuid
        references public.subscriptions(id)
        on delete set null,

    invoice_number varchar(100)
        not null unique,

    subtotal numeric(12,2)
        not null default 0,

    discount numeric(12,2)
        not null default 0,

    tax numeric(12,2)
        not null default 0,

    total numeric(12,2)
        not null default 0,

    currency varchar(10)
        not null default 'USD',

    status varchar(50)
        not null default 'PENDING',

    due_date timestamptz,

    paid_at timestamptz,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 23. ANALYTICS EVENTS
-- =========================================================

create table public.analytics_events (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        not null references public.restaurants(id)
        on delete cascade,

    branch_id uuid
        references public.branches(id)
        on delete set null,

    menu_id uuid
        references public.menus(id)
        on delete set null,

    product_id uuid
        references public.products(id)
        on delete set null,

    event_type public.event_type
        not null,

    session_id varchar(255),

    visitor_id varchar(255),

    user_agent text,

    referrer text,

    country varchar(100),

    device_type varchar(50),

    metadata jsonb
        not null default '{}'::jsonb,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 24. NOTIFICATIONS
-- =========================================================

create table public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        not null references public.profiles(id)
        on delete cascade,

    restaurant_id uuid
        references public.restaurants(id)
        on delete cascade,

    type varchar(100)
        not null,

    title varchar(255)
        not null,

    message text
        not null,

    is_read boolean
        not null default false,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 25. AUDIT LOGS
-- =========================================================

create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    restaurant_id uuid
        references public.restaurants(id)
        on delete set null,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    action varchar(100)
        not null,

    entity_type varchar(100),

    entity_id uuid,

    old_data jsonb,

    new_data jsonb,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 26. RESERVED SUBDOMAINS
-- =========================================================

create table public.reserved_subdomains (
    id uuid primary key default gen_random_uuid(),

    slug varchar(100)
        not null unique,

    created_at timestamptz
        not null default now()
);


-- =========================================================
-- 27. INDEXES
-- =========================================================

create index idx_restaurant_users_user
on public.restaurant_users(user_id);

create index idx_restaurant_users_restaurant
on public.restaurant_users(restaurant_id);

create index idx_menus_restaurant
on public.menus(restaurant_id);

create index idx_categories_menu
on public.categories(menu_id);

create index idx_products_category
on public.products(category_id);

create index idx_products_status
on public.products(status);

create index idx_product_images_product
on public.product_images(product_id);

create index idx_option_groups_product
on public.product_option_groups(product_id);

create index idx_options_group
on public.product_options(option_group_id);

create index idx_branches_restaurant
on public.branches(restaurant_id);

create index idx_business_hours_restaurant
on public.business_hours(restaurant_id);

create index idx_business_hours_branch
on public.business_hours(branch_id);

create index idx_qr_codes_restaurant
on public.qr_codes(restaurant_id);

create index idx_custom_domains_restaurant
on public.custom_domains(restaurant_id);

create index idx_subscriptions_restaurant
on public.subscriptions(restaurant_id);

create index idx_payments_restaurant
on public.payments(restaurant_id);

create index idx_invoices_restaurant
on public.invoices(restaurant_id);

create index idx_analytics_restaurant
on public.analytics_events(restaurant_id);

create index idx_analytics_created_at
on public.analytics_events(created_at);

create index idx_analytics_event_type
on public.analytics_events(event_type);

create index idx_notifications_user
on public.notifications(user_id);

create index idx_notifications_restaurant
on public.notifications(restaurant_id);

create index idx_audit_logs_restaurant
on public.audit_logs(restaurant_id);

create index idx_audit_logs_user
on public.audit_logs(user_id);


-- =========================================================
-- 28. UPDATED_AT FUNCTION
-- =========================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =========================================================
-- 29. UPDATED_AT TRIGGERS
-- =========================================================

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

create trigger restaurants_updated_at
before update on public.restaurants
for each row
execute function public.handle_updated_at();

create trigger restaurant_users_updated_at
before update on public.restaurant_users
for each row
execute function public.handle_updated_at();

create trigger menus_updated_at
before update on public.menus
for each row
execute function public.handle_updated_at();

create trigger categories_updated_at
before update on public.categories
for each row
execute function public.handle_updated_at();

create trigger products_updated_at
before update on public.products
for each row
execute function public.handle_updated_at();

create trigger product_option_groups_updated_at
before update on public.product_option_groups
for each row
execute function public.handle_updated_at();

create trigger product_options_updated_at
before update on public.product_options
for each row
execute function public.handle_updated_at();

create trigger themes_updated_at
before update on public.themes
for each row
execute function public.handle_updated_at();

create trigger restaurant_themes_updated_at
before update on public.restaurant_themes
for each row
execute function public.handle_updated_at();

create trigger branches_updated_at
before update on public.branches
for each row
execute function public.handle_updated_at();

create trigger custom_domains_updated_at
before update on public.custom_domains
for each row
execute function public.handle_updated_at();

create trigger plans_updated_at
before update on public.plans
for each row
execute function public.handle_updated_at();

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.handle_updated_at();


-- =========================================================
-- 30. CREATE PROFILE AUTOMATICALLY AFTER SIGNUP
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        full_name
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name'
        )
    );

    return new;

end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- 31. HELPER FUNCTION
-- Get restaurants belonging to current user
-- =========================================================

create or replace function public.user_restaurant_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
    select restaurant_id
    from public.restaurant_users
    where user_id = auth.uid()
      and is_active = true;
$$;

grant execute on function public.user_restaurant_ids() to authenticated;


-- =========================================================
-- 31b. PLATFORM ADMIN + PUBLIC MENU HELPERS
-- =========================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and is_active = true
          and platform_role in ('ADMIN', 'SUPER_ADMIN')
    );
$$;

grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.is_restaurant_owner(p_restaurant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.restaurant_users
        where restaurant_id = p_restaurant_id
          and user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    );
$$;

grant execute on function public.is_restaurant_owner(uuid) to authenticated;

create or replace function public.restaurant_public_state(p_slug text)
returns table (
    id uuid,
    name varchar,
    slug varchar,
    logo_url text,
    status public.restaurant_status,
    menu_status public.menu_status
)
language sql
security definer
stable
set search_path = public
as $$
    select r.id, r.name, r.slug, r.logo_url, r.status, r.menu_status
    from public.restaurants r
    where r.slug = p_slug
    limit 1;
$$;

grant execute on function public.restaurant_public_state(text) to anon, authenticated;

create or replace function public.protect_restaurant_business_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'UPDATE' and new.business_type is distinct from old.business_type then
        if auth.role() is distinct from 'service_role'
           and not public.is_platform_admin() then
            raise exception 'نوع النشاط يُحدد من الإدارة فقط';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists restaurants_protect_business_type on public.restaurants;
create trigger restaurants_protect_business_type
before update on public.restaurants
for each row
execute function public.protect_restaurant_business_type();


-- =========================================================
-- 31c. ADMIN PROVISIONING (no service-role key required)
-- =========================================================

create or replace function public.admin_create_owner_account(
    p_email text,
    p_password text,
    p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
    new_id uuid;
    normalized_email text;
begin
    if not public.is_platform_admin() then
        raise exception 'NOT_AUTHORIZED';
    end if;

    normalized_email := lower(trim(p_email));
    if normalized_email is null or normalized_email = '' then
        raise exception 'EMAIL_REQUIRED';
    end if;
    if p_password is null or char_length(p_password) < 8 then
        raise exception 'PASSWORD_TOO_SHORT';
    end if;
    if exists (select 1 from auth.users where email = normalized_email) then
        raise exception 'EMAIL_TAKEN';
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) values (
        '00000000-0000-0000-0000-000000000000',
        new_id,
        'authenticated',
        'authenticated',
        normalized_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', coalesce(nullif(trim(p_full_name), ''), normalized_email)),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    insert into auth.identities (
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) values (
        new_id,
        jsonb_build_object(
            'sub', new_id::text,
            'email', normalized_email,
            'email_verified', true
        ),
        'email',
        new_id::text,
        now(),
        now(),
        now()
    );

    update public.profiles
    set
        full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
        is_active = true,
        updated_at = now()
    where id = new_id;

    return new_id;
end;
$$;

create or replace function public.admin_delete_auth_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if not public.is_platform_admin() then
        raise exception 'NOT_AUTHORIZED';
    end if;
    delete from auth.identities where user_id = p_user_id;
    delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_create_owner_account(text, text, text) from public, anon;
revoke all on function public.admin_delete_auth_user(uuid) from public, anon;
grant execute on function public.admin_create_owner_account(text, text, text) to authenticated;
grant execute on function public.admin_delete_auth_user(uuid) to authenticated;

create or replace function public.ensure_images_bucket()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
begin
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
        'images',
        'images',
        true,
        5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
    )
    on conflict (id) do update
    set public = true;
end;
$$;

revoke all on function public.ensure_images_bucket() from public, anon;
grant execute on function public.ensure_images_bucket() to authenticated;


-- =========================================================
-- 32. RLS ENABLE
-- =========================================================

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_users enable row level security;
alter table public.menus enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;
alter table public.themes enable row level security;
alter table public.restaurant_themes enable row level security;
alter table public.social_links enable row level security;
alter table public.branches enable row level security;
alter table public.business_hours enable row level security;
alter table public.qr_codes enable row level security;
alter table public.custom_domains enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.analytics_events enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reserved_subdomains enable row level security;


-- =========================================================
-- 33. PROFILES POLICIES
-- =========================================================

create policy "Users can view own profile"
on public.profiles
for select
using (
    id = auth.uid()
);

create policy "Users can update own profile"
on public.profiles
for update
using (
    id = auth.uid()
)
with check (
    id = auth.uid()
);

create policy "Restaurant members can view teammate profiles"
on public.profiles
for select
using (
    id in (
        select ru.user_id
        from public.restaurant_users ru
        where ru.restaurant_id in (select public.user_restaurant_ids())
    )
    or public.is_platform_admin()
);

create policy "Platform admins can manage profiles"
on public.profiles
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 34. RESTAURANTS POLICIES
-- =========================================================

create policy "Restaurant members can view restaurant"
on public.restaurants
for select
using (
    id in (
        select public.user_restaurant_ids()
    )
);

create policy "Restaurant owners can update restaurant"
on public.restaurants
for update
using (
    id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
)
with check (
    id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
);

-- Customers cannot insert restaurants. Admins provision tenants.
create policy "Platform admins can manage restaurants"
on public.restaurants
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Public can view published restaurants"
on public.restaurants
for select
using (
    menu_status = 'PUBLISHED'
    and status in ('TRIAL', 'ACTIVE')
);


-- =========================================================
-- 35. RESTAURANT USERS POLICIES
-- =========================================================

create policy "Users can view own memberships"
on public.restaurant_users
for select
using (
    user_id = auth.uid()
    or public.is_platform_admin()
);

create policy "Restaurant members can view members"
on public.restaurant_users
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

-- Uses a SECURITY DEFINER helper to avoid RLS recursion.
create policy "Owners can manage restaurant users"
on public.restaurant_users
for all
using (
    public.is_restaurant_owner(restaurant_id)
    or public.is_platform_admin()
)
with check (
    public.is_restaurant_owner(restaurant_id)
    or public.is_platform_admin()
);

create policy "Platform admins can manage restaurant users"
on public.restaurant_users
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 36. MENUS
-- =========================================================

create policy "Restaurant members can view menus"
on public.menus
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Restaurant managers can manage menus"
on public.menus
for all
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
)
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
);

create policy "Platform admins can manage menus"
on public.menus
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Public can view published menus"
on public.menus
for select
using (
    status = 'PUBLISHED'
    and restaurant_id in (
        select id from public.restaurants
        where menu_status = 'PUBLISHED'
          and status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 37. CATEGORIES
-- =========================================================

create policy "Restaurant members can view categories"
on public.categories
for select
using (
    exists (
        select 1
        from public.menus m
        where m.id = categories.menu_id
          and m.restaurant_id in (
              select public.user_restaurant_ids()
          )
    )
);

create policy "Restaurant members can manage categories"
on public.categories
for all
using (
    exists (
        select 1
        from public.menus m
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where m.id = categories.menu_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.menus m
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where m.id = categories.menu_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
);

create policy "Public can view published categories"
on public.categories
for select
using (
    is_active = true
    and exists (
        select 1
        from public.menus m
        join public.restaurants r on r.id = m.restaurant_id
        where m.id = categories.menu_id
          and m.status = 'PUBLISHED'
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 38. PRODUCTS
-- =========================================================

create policy "Restaurant members can view products"
on public.products
for select
using (
    exists (
        select 1
        from public.categories c
        join public.menus m
          on m.id = c.menu_id
        where c.id = products.category_id
          and m.restaurant_id in (
              select public.user_restaurant_ids()
          )
    )
);

create policy "Restaurant members can manage products"
on public.products
for all
using (
    exists (
        select 1
        from public.categories c
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where c.id = products.category_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.categories c
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where c.id = products.category_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
);

create policy "Public can view visible products"
on public.products
for select
using (
    status <> 'HIDDEN'
    and exists (
        select 1
        from public.categories c
        join public.menus m on m.id = c.menu_id
        join public.restaurants r on r.id = m.restaurant_id
        where c.id = products.category_id
          and c.is_active = true
          and m.status = 'PUBLISHED'
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 39. PRODUCT IMAGES
-- =========================================================

create policy "Restaurant members can manage product images"
on public.product_images
for all
using (
    exists (
        select 1
        from public.products p
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where p.id = product_images.product_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.products p
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where p.id = product_images.product_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
);

create policy "Public can view product images"
on public.product_images
for select
using (
    exists (
        select 1
        from public.products p
        join public.categories c on c.id = p.category_id
        join public.menus m on m.id = c.menu_id
        join public.restaurants r on r.id = m.restaurant_id
        where p.id = product_images.product_id
          and p.status <> 'HIDDEN'
          and m.status = 'PUBLISHED'
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 40. OPTION GROUPS
-- =========================================================

create policy "Restaurant members can manage option groups"
on public.product_option_groups
for all
using (
    exists (
        select 1
        from public.products p
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where p.id = product_option_groups.product_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.products p
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where p.id = product_option_groups.product_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
);

create policy "Public can view option groups"
on public.product_option_groups
for select
using (
    exists (
        select 1
        from public.products p
        join public.categories c on c.id = p.category_id
        join public.menus m on m.id = c.menu_id
        join public.restaurants r on r.id = m.restaurant_id
        where p.id = product_option_groups.product_id
          and p.status <> 'HIDDEN'
          and m.status = 'PUBLISHED'
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 41. OPTIONS
-- =========================================================

create policy "Restaurant members can manage options"
on public.product_options
for all
using (
    exists (
        select 1
        from public.product_option_groups pog
        join public.products p
          on p.id = pog.product_id
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where pog.id = product_options.option_group_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
)
with check (
    exists (
        select 1
        from public.product_option_groups pog
        join public.products p
          on p.id = pog.product_id
        join public.categories c
          on c.id = p.category_id
        join public.menus m
          on m.id = c.menu_id
        join public.restaurant_users ru
          on ru.restaurant_id = m.restaurant_id
        where pog.id = product_options.option_group_id
          and ru.user_id = auth.uid()
          and ru.role in ('OWNER', 'MANAGER', 'EDITOR')
          and ru.is_active = true
    )
);

create policy "Public can view options"
on public.product_options
for select
using (
    is_active = true
    and exists (
        select 1
        from public.product_option_groups pog
        join public.products p on p.id = pog.product_id
        join public.categories c on c.id = p.category_id
        join public.menus m on m.id = c.menu_id
        join public.restaurants r on r.id = m.restaurant_id
        where pog.id = product_options.option_group_id
          and p.status <> 'HIDDEN'
          and m.status = 'PUBLISHED'
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 41b. THEMES
-- =========================================================

create policy "Anyone can view active themes"
on public.themes
for select
using (
    is_active = true
    or public.is_platform_admin()
);

create policy "Platform admins can manage themes"
on public.themes
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 42. RESTAURANT THEMES
-- =========================================================

create policy "Restaurant members can view theme"
on public.restaurant_themes
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Restaurant managers can manage theme"
on public.restaurant_themes
for all
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
)
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
);

create policy "Platform admins can manage restaurant themes"
on public.restaurant_themes
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "Public can view restaurant themes"
on public.restaurant_themes
for select
using (
    restaurant_id in (
        select id from public.restaurants
        where menu_status = 'PUBLISHED'
          and status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 43. SOCIAL LINKS
-- =========================================================

create policy "Restaurant members can manage social links"
on public.social_links
for all
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
)
with check (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Public can view social links"
on public.social_links
for select
using (
    is_active = true
    and restaurant_id in (
        select id from public.restaurants
        where menu_status = 'PUBLISHED'
          and status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 44. BRANCHES
-- =========================================================

create policy "Restaurant members can view branches"
on public.branches
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Restaurant managers can manage branches"
on public.branches
for all
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
)
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role in ('OWNER', 'MANAGER')
          and is_active = true
    )
);

create policy "Public can view active branches"
on public.branches
for select
using (
    is_active = true
    and restaurant_id in (
        select id
        from public.restaurants
        where menu_status = 'PUBLISHED'
          and status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 45. BUSINESS HOURS
-- =========================================================

create policy "Restaurant members can manage business hours"
on public.business_hours
for all
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
)
with check (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Public can view business hours"
on public.business_hours
for select
using (
    restaurant_id in (
        select id from public.restaurants
        where menu_status = 'PUBLISHED'
          and status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 46. QR CODES
-- =========================================================

create policy "Restaurant members can manage QR codes"
on public.qr_codes
for all
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
)
with check (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);


-- =========================================================
-- 47. CUSTOM DOMAINS
-- =========================================================

create policy "Restaurant members can view domains"
on public.custom_domains
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Restaurant owners can manage domains"
on public.custom_domains
for all
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
)
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
);


-- =========================================================
-- 48. PLANS
-- Public read
-- =========================================================

create policy "Anyone can view active plans"
on public.plans
for select
using (
    is_active = true
);

create policy "Platform admins can manage plans"
on public.plans
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 49. SUBSCRIPTIONS
-- =========================================================

create policy "Restaurant members can view subscriptions"
on public.subscriptions
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Owners can insert trial subscriptions"
on public.subscriptions
for insert
to authenticated
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
    or public.is_platform_admin()
);

create policy "Owners can update subscriptions"
on public.subscriptions
for update
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
)
with check (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
);

create policy "Platform admins can manage subscriptions"
on public.subscriptions
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 50. PAYMENTS
-- =========================================================

create policy "Restaurant owners can view payments"
on public.payments
for select
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
);

create policy "Platform admins can manage payments"
on public.payments
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 51. INVOICES
-- =========================================================

create policy "Restaurant owners can view invoices"
on public.invoices
for select
using (
    restaurant_id in (
        select restaurant_id
        from public.restaurant_users
        where user_id = auth.uid()
          and role = 'OWNER'
          and is_active = true
    )
);

create policy "Platform admins can manage invoices"
on public.invoices
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());


-- =========================================================
-- 52. ANALYTICS
-- =========================================================

create policy "Restaurant members can view analytics"
on public.analytics_events
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);

create policy "Anyone can insert public analytics"
on public.analytics_events
for insert
with check (
    exists (
        select 1 from public.restaurants r
        where r.id = restaurant_id
          and r.menu_status = 'PUBLISHED'
          and r.status in ('TRIAL', 'ACTIVE')
    )
);


-- =========================================================
-- 53. NOTIFICATIONS
-- =========================================================

create policy "Users can view own notifications"
on public.notifications
for select
using (
    user_id = auth.uid()
);


create policy "Users can update own notifications"
on public.notifications
for update
using (
    user_id = auth.uid()
)
with check (
    user_id = auth.uid()
);


-- =========================================================
-- 54. AUDIT LOGS
-- =========================================================

create policy "Restaurant members can view audit logs"
on public.audit_logs
for select
using (
    restaurant_id in (
        select public.user_restaurant_ids()
    )
);


-- =========================================================
-- 55. RESERVED SUBDOMAINS
-- Public read
-- =========================================================

create policy "Anyone can view reserved subdomains"
on public.reserved_subdomains
for select
using (true);


-- =========================================================
-- 55b. STORAGE — public images bucket
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'images',
    'images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view images" on storage.objects;
create policy "Public can view images"
on storage.objects
for select
using (bucket_id = 'images');

drop policy if exists "Authenticated can upload images" on storage.objects;
create policy "Authenticated can upload images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images');

drop policy if exists "Authenticated can update images" on storage.objects;
create policy "Authenticated can update images"
on storage.objects
for update
to authenticated
using (bucket_id = 'images')
with check (bucket_id = 'images');

drop policy if exists "Authenticated can delete images" on storage.objects;
create policy "Authenticated can delete images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'images');


-- =========================================================
-- 56. SEED PLANS
-- =========================================================

insert into public.plans (
    name,
    slug,
    description,
    price_monthly,
    price_yearly,
    currency,
    max_menus,
    max_products,
    max_branches,
    max_staff,
    analytics_enabled,
    custom_domain_enabled,
    remove_branding,
    advanced_analytics
)
values

(
    'Free',
    'free',
    'الخطة المجانية',
    0,
    0,
    'USD',
    1,
    30,
    1,
    1,
    false,
    false,
    false,
    false
),

(
    'Pro',
    'pro',
    'الخطة الاحترافية',
    10,
    100,
    'USD',
    5,
    null,
    1,
    5,
    true,
    false,
    true,
    false
),

(
    'Business',
    'business',
    'خطة الشركات',
    25,
    250,
    'USD',
    null,
    null,
    null,
    null,
    true,
    true,
    true,
    true
);


-- =========================================================
-- 57. SEED THEMES
-- =========================================================

insert into public.themes (
    name,
    slug,
    description,
    is_premium
)
values

(
    'Modern',
    'modern',
    'تصميم عصري',
    false
),

(
    'Classic',
    'classic',
    'تصميم كلاسيكي',
    false
),

(
    'Elegant',
    'elegant',
    'تصميم أنيق',
    true
),

(
    'Minimal',
    'minimal',
    'تصميم بسيط',
    false
),

(
    'Fast Food',
    'fast-food',
    'تصميم مناسب للمطاعم السريعة',
    true
),

(
    'Coffee',
    'coffee',
    'تصميم مناسب للمقاهي',
    true
);


-- =========================================================
-- 58. RESERVED SUBDOMAINS
-- =========================================================

insert into public.reserved_subdomains (slug)
values
    ('www'),
    ('app'),
    ('admin'),
    ('api'),
    ('dashboard'),
    ('mail'),
    ('support'),
    ('help'),
    ('blog'),
    ('docs'),
    ('status'),
    ('cdn'),
    ('static'),
    ('assets'),
    ('login'),
    ('signup'),
    ('register');

-- Super admin account: run supabase/migrations/00005_seed_super_admin.sql
-- after changing the email/password in that file. Do not store production
-- credentials in this schema reference.


-- =========================================================
-- END
-- =========================================================
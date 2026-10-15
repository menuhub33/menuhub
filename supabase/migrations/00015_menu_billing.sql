-- Financial contracts for menus created by the platform admin.
-- Run once in Supabase → SQL Editor.

create table if not exists public.menu_billings (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null unique references public.restaurants(id) on delete cascade,
    price numeric(12,2) not null check (price >= 0),
    setup_cost numeric(12,2) not null default 0 check (setup_cost >= 0),
    annual_renewal numeric(12,2) not null default 0 check (annual_renewal >= 0),
    discount_type text not null default 'NONE' check (discount_type in ('NONE', 'PERCENT', 'AMOUNT')),
    discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
    installments_count integer not null default 1 check (installments_count between 1 and 24),
    currency varchar(10) not null default 'SYP',
    starts_on date not null default current_date,
    next_renewal_on date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.menu_installments (
    id uuid primary key default gen_random_uuid(),
    billing_id uuid not null references public.menu_billings(id) on delete cascade,
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    kind text not null default 'INSTALLMENT' check (kind in ('INSTALLMENT', 'RENEWAL')),
    sequence integer not null check (sequence > 0),
    amount numeric(12,2) not null check (amount >= 0),
    due_on date not null,
    status text not null default 'PENDING' check (status in ('PENDING', 'PAID')),
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    unique (billing_id, kind, sequence)
);

create index if not exists menu_installments_billing_idx
    on public.menu_installments (billing_id, kind, sequence);

drop trigger if exists menu_billings_updated_at on public.menu_billings;
create trigger menu_billings_updated_at
before update on public.menu_billings
for each row
execute function public.handle_updated_at();

alter table public.menu_billings enable row level security;
alter table public.menu_installments enable row level security;

drop policy if exists "Platform admins manage menu billings" on public.menu_billings;
create policy "Platform admins manage menu billings"
on public.menu_billings
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

drop policy if exists "Platform admins manage menu installments" on public.menu_installments;
create policy "Platform admins manage menu installments"
on public.menu_installments
for all
using (public.is_platform_admin())
with check (public.is_platform_admin());

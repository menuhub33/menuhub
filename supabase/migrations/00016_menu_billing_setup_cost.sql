-- Hosting / installation cost for each menu contract.
-- Run once in Supabase → SQL Editor if 00015 was applied earlier.

alter table public.menu_billings
    add column if not exists setup_cost numeric(12,2) not null default 0 check (setup_cost >= 0);

comment on column public.menu_billings.setup_cost is
    'Platform cost for hosting or installation. Subtracted from the discounted menu price to get profit.';

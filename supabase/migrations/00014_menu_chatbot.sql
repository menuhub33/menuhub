-- Public menu chatbot settings (per restaurant / published menu)

alter table public.restaurants
    add column if not exists chatbot_enabled boolean not null default true;

alter table public.restaurants
    add column if not exists chatbot_name varchar(80);

alter table public.restaurants
    add column if not exists chatbot_welcome text;

comment on column public.restaurants.chatbot_enabled is
    'When true, the public menu shows a catalog-aware assistant widget.';

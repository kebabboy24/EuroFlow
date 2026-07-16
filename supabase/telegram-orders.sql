alter table public.orders
  alter column user_id drop not null;

alter table public.orders
  add column if not exists source text not null default 'web',
  add column if not exists telegram_chat_id bigint,
  add column if not exists telegram_user_id bigint;

create index if not exists orders_telegram_chat_id_created_at_idx
on public.orders(telegram_chat_id, created_at desc);

create table if not exists public.telegram_order_sessions (
  chat_id bigint primary key,
  username text,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.telegram_order_sessions enable row level security;

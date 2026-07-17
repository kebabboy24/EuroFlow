create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source text not null default 'web',
  telegram_chat_id bigint,
  telegram_user_id bigint,
  full_name text not null,
  email text not null,
  telegram text not null,
  send_amount numeric not null check (send_amount > 0),
  send_currency text not null,
  receive_amount numeric not null check (receive_amount > 0),
  receive_currency text not null default 'EUR',
  send_region text,
  send_method text,
  send_bank text,
  receive_region text,
  receive_method text,
  receive_bank text,
  payout_details text,
  payment_reference text,
  payment_requisites jsonb,
  rate_value numeric,
  bank_name text not null,
  iban text not null,
  comment text,
  status text not null default 'awaiting_requisites',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can read own orders"
on public.orders for select
using (auth.uid() = user_id);

create policy "Users can create own orders"
on public.orders for insert
with check (auth.uid() = user_id);

create index if not exists orders_user_id_created_at_idx
on public.orders(user_id, created_at desc);

create index if not exists orders_telegram_chat_id_created_at_idx
on public.orders(telegram_chat_id, created_at desc);

create index if not exists orders_payment_reference_idx
on public.orders(payment_reference);

create table if not exists public.telegram_order_sessions (
  chat_id bigint primary key,
  username text,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.telegram_order_sessions enable row level security;

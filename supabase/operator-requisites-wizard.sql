create table if not exists public.operator_requisites_sessions (
  chat_id bigint primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  step text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.operator_requisites_sessions enable row level security;

create index if not exists operator_requisites_sessions_order_id_idx
on public.operator_requisites_sessions(order_id);

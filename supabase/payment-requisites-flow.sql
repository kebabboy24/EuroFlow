alter table public.orders
  add column if not exists payment_requisites jsonb,
  add column if not exists paid_at timestamptz;

alter table public.orders
  alter column status set default 'awaiting_requisites';

create index if not exists orders_status_created_at_idx
on public.orders(status, created_at desc);

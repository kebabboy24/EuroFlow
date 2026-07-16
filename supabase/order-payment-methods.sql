alter table public.orders
  add column if not exists send_region text,
  add column if not exists send_method text,
  add column if not exists send_bank text,
  add column if not exists receive_region text,
  add column if not exists receive_method text,
  add column if not exists receive_bank text,
  add column if not exists payout_details text,
  add column if not exists payment_reference text,
  add column if not exists rate_value numeric;

create index if not exists orders_payment_reference_idx
on public.orders(payment_reference);

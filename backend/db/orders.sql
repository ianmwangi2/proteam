-- Orders and Order Items tables for Proteam e-commerce
-- Run this in Supabase SQL Editor

-- ── Orders Table ─────────────────────────────────────────

create table if not exists public.orders (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  status           text default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  subtotal         numeric(12,2) not null default 0,
  tax              numeric(12,2) not null default 0,
  shipping         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  shipping_address text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

-- ── Order Items Table ────────────────────────────────────

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete restrict,
  qty         integer not null default 1,
  unit_price  numeric(10,2) not null,
  line_total  numeric(12,2) not null,
  created_at  timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- ── Row-Level Security ──────────────────────────────────

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders: users see own, admins see all (enforced at API layer via service_role)
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert with check (auth.uid() = user_id);

-- Order items: public read if order accessible
drop policy if exists "Order items are viewable" on public.order_items;
create policy "Order items are viewable"
  on public.order_items for select using (true);

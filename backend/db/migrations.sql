-- =============================================================
-- Proteam Group — Migration: Old E-commerce → Service Portal
-- Run this in Supabase SQL Editor on an EXISTING database.
-- For a brand-new database, just run schema.sql directly.
-- =============================================================

-- ── STEP 1: Drop old e-commerce tables ───────────────────────
-- Order matters due to foreign keys: children first, then parents.

drop table if exists public.cart_items   cascade;
drop table if exists public.order_items  cascade;
drop table if exists public.orders       cascade;
drop table if exists public.settings     cascade;

-- Drop the old stock helper function (no longer used)
drop function if exists public.decrement_stock(bigint, integer);

-- ── STEP 2: Add new service-portal tables ────────────────────

-- ── Services ─────────────────────────────────────────────────

create table if not exists public.services (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  name        text not null,
  tagline     text,
  description text,
  icon        text,
  image_url   text,
  features    jsonb default '[]',
  is_active   boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Link products to services
alter table public.products
  add column if not exists service_id bigint references public.services(id) on delete set null;

create index if not exists idx_products_service_id on public.products(service_id);

alter table public.services enable row level security;

drop policy if exists "Services are viewable by everyone" on public.services;
create policy "Services are viewable by everyone"
  on public.services for select using (true);

-- ── Product Reviews ──────────────────────────────────────────

create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  user_id     uuid  not null references auth.users(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_verified boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id, user_id)
);

create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id    on public.reviews(user_id);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone"       on public.reviews;
drop policy if exists "Authenticated users can insert reviews" on public.reviews;
drop policy if exists "Users can update own reviews"           on public.reviews;
drop policy if exists "Users can delete own reviews"           on public.reviews;
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ── Quotations ───────────────────────────────────────────────

create table if not exists public.quotations (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  service_id      bigint references public.services(id) on delete set null,
  status          text default 'pending'
                  check (status in ('pending','quoted','accepted','declined','expired')),
  description     text not null,
  budget_range    text,
  quoted_amount   numeric(12,2),
  admin_notes     text,
  valid_until     timestamptz,
  accepted_at     timestamptz,
  declined_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_quotations_user_id on public.quotations(user_id);
create index if not exists idx_quotations_status  on public.quotations(status);

alter table public.quotations enable row level security;

drop policy if exists "Users can view own quotations"             on public.quotations;
drop policy if exists "Authenticated users can create quotations" on public.quotations;
drop policy if exists "Users can update own quotations"           on public.quotations;
create policy "Users can view own quotations"
  on public.quotations for select
  using (auth.uid() = user_id);

create policy "Authenticated users can create quotations"
  on public.quotations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own quotations"
  on public.quotations for update
  using (auth.uid() = user_id);

-- ── Wishlist ─────────────────────────────────────────────────

create table if not exists public.wishlist (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

create index if not exists idx_wishlist_user_id on public.wishlist(user_id);

alter table public.wishlist enable row level security;

drop policy if exists "Users can manage own wishlist" on public.wishlist;
create policy "Users can manage own wishlist"
  on public.wishlist for all
  using (auth.uid() = user_id);

-- ── Inventory Logs ───────────────────────────────────────────

create table if not exists public.inventory_logs (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  admin_id    uuid   references auth.users(id) on delete set null,
  change      integer not null,
  reason      text,
  stock_after integer not null,
  created_at  timestamptz default now()
);

create index if not exists idx_inv_logs_product_id on public.inventory_logs(product_id);

alter table public.inventory_logs enable row level security;

drop policy if exists "Admin can view inventory logs" on public.inventory_logs;
create policy "Admin can view inventory logs"
  on public.inventory_logs for select using (true);

-- ── Audit Logs ───────────────────────────────────────────────

create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  admin_id    uuid  references auth.users(id) on delete set null,
  action      text  not null,
  target_type text,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_audit_admin_id   on public.audit_logs(admin_id);
create index if not exists idx_audit_action     on public.audit_logs(action);
create index if not exists idx_audit_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Audit logs viewable by everyone" on public.audit_logs;
create policy "Audit logs viewable by everyone"
  on public.audit_logs for select using (true);

-- ── Full-text search on products ─────────────────────────────

create index if not exists idx_products_fts
  on public.products using gin(
    to_tsvector('english',
      coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
  );

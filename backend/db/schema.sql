-- =============================================================
-- Proteam Group — Complete Database Schema (Clean Slate)
-- Security Services Portal — Run in Supabase SQL Editor
-- =============================================================
-- NOTE: If migrating from the old e-commerce schema, run
--       migrations.sql first to safely drop the old tables.
-- =============================================================

-- ── 1. Products ──────────────────────────────────────────────

create table if not exists public.products (
  id          bigint generated always as identity primary key,
  sku         text unique,
  name        text not null,
  category    text,
  label       text,
  description text,
  price_ksh   numeric(10,2),
  badge       text,
  emoji       text,
  image_url   text,
  rating      numeric(2,1) default 0,
  reviews     integer default 0,
  stock       integer default 0,
  service_id  bigint,                    -- FK added after services table
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 2. Profiles (extends auth.users) ─────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  address     text,
  role        text default 'customer' check (role in ('admin', 'customer')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. Services ──────────────────────────────────────────────

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

-- Now add the FK from products → services
alter table public.products
  add constraint if not exists fk_products_service
  foreign key (service_id) references public.services(id) on delete set null;

-- ── 4. Reviews ───────────────────────────────────────────────

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

-- ── 5. Quotations ────────────────────────────────────────────

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

-- ── 6. Wishlist ──────────────────────────────────────────────

create table if not exists public.wishlist (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  product_id  bigint not null references public.products(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

-- ── 7. Inventory Logs ────────────────────────────────────────

create table if not exists public.inventory_logs (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  admin_id    uuid   references auth.users(id) on delete set null,
  change      integer not null,
  reason      text,
  stock_after integer not null,
  created_at  timestamptz default now()
);

-- ── 8. Audit Logs ────────────────────────────────────────────

create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  admin_id    uuid  references auth.users(id) on delete set null,
  action      text  not null,
  target_type text,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz default now()
);

-- ── 9. Row-Level Security ────────────────────────────────────

alter table public.products       enable row level security;
alter table public.profiles       enable row level security;
alter table public.services       enable row level security;
alter table public.reviews        enable row level security;
alter table public.quotations     enable row level security;
alter table public.wishlist       enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.audit_logs     enable row level security;

-- Products: public read
drop policy if exists "Products are viewable by everyone"          on public.products;
create policy "Products are viewable by everyone"
  on public.products for select using (true);

-- Profiles
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Services: public read
drop policy if exists "Services are viewable by everyone" on public.services;
create policy "Services are viewable by everyone"
  on public.services for select using (true);

-- Reviews: public read, auth write
drop policy if exists "Reviews are viewable by everyone"       on public.reviews;
drop policy if exists "Authenticated users can insert reviews" on public.reviews;
drop policy if exists "Users can update own reviews"           on public.reviews;
drop policy if exists "Users can delete own reviews"           on public.reviews;
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

-- Quotations: users manage own
drop policy if exists "Users can view own quotations"             on public.quotations;
drop policy if exists "Authenticated users can create quotations" on public.quotations;
drop policy if exists "Users can update own quotations"           on public.quotations;
create policy "Users can view own quotations"
  on public.quotations for select using (auth.uid() = user_id);

create policy "Authenticated users can create quotations"
  on public.quotations for insert with check (auth.uid() = user_id);

create policy "Users can update own quotations"
  on public.quotations for update using (auth.uid() = user_id);

-- Wishlist: users manage own
drop policy if exists "Users can manage own wishlist" on public.wishlist;
create policy "Users can manage own wishlist"
  on public.wishlist for all using (auth.uid() = user_id);

-- Inventory & audit: open read (admin enforced at API layer)
drop policy if exists "Inventory logs viewable by everyone" on public.inventory_logs;
create policy "Inventory logs viewable by everyone"
  on public.inventory_logs for select using (true);

drop policy if exists "Audit logs viewable by everyone" on public.audit_logs;
create policy "Audit logs viewable by everyone"
  on public.audit_logs for select using (true);

-- ── 10. Indexes ──────────────────────────────────────────────

create index if not exists idx_products_category   on public.products(category);
create index if not exists idx_products_sku        on public.products(sku);
create index if not exists idx_products_service_id on public.products(service_id);
create index if not exists idx_products_fts
  on public.products using gin(
    to_tsvector('english',
      coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
  );

create index if not exists idx_reviews_product_id  on public.reviews(product_id);
create index if not exists idx_reviews_user_id     on public.reviews(user_id);

create index if not exists idx_quotations_user_id  on public.quotations(user_id);
create index if not exists idx_quotations_status   on public.quotations(status);

create index if not exists idx_wishlist_user_id    on public.wishlist(user_id);

create index if not exists idx_inv_logs_product_id on public.inventory_logs(product_id);

create index if not exists idx_audit_admin_id      on public.audit_logs(admin_id);
create index if not exists idx_audit_action        on public.audit_logs(action);
create index if not exists idx_audit_created_at    on public.audit_logs(created_at desc);

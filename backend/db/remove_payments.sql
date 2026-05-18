-- =============================================================
-- Proteam Group — Payment & Orders Removal Migration
-- Run in Supabase SQL Editor
-- =============================================================
-- This migration removes all order/payment related tables and
-- columns that are no longer needed in the quotation-only model.
-- =============================================================

-- ── Drop legacy order/payment tables (if they still exist) ───

drop table if exists public.order_items   cascade;
drop table if exists public.cart_items    cascade;
drop table if exists public.orders        cascade;
drop table if exists public.payments      cascade;

-- ── Remove payment_status column from quotations (if present) ──
-- (The quotations table uses 'status' only — no separate payment_status)
alter table public.quotations
  drop column if exists payment_status;

-- ── Remove price_ksh from products if no longer needed ───────
-- NOTE: Keep price_ksh for reference/catalog purposes only.
-- If you want to remove it, uncomment the following line:
-- alter table public.products drop column if exists price_ksh;

-- ── Confirm remaining tables ──────────────────────────────────
-- Expected tables after migration:
--   products, profiles, services, reviews,
--   quotations, wishlist, inventory_logs, audit_logs

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type   = 'BASE TABLE'
order by table_name;

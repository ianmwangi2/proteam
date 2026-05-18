# ProTeam Backend Setup Guide

This guide covers the final steps to enable all features and ensure full system connectivity.

## ✅ Current Status

### Frontend Completed
- ✅ Services data structure (8 services in `src/data/services.js`)
- ✅ Products mapped to services (12 products in `src/data/products.js`)
- ✅ ServiceDetail page component and styling
- ✅ Home page redesigned with services grid
- ✅ Checkout form ready to submit orders
- ✅ Admin pages (AdminDash, Inventory, Analytics) implemented with API calls
- ✅ All routes configured in App.jsx

### Backend Configuration  
- ✅ Orders route enabled (imported and mounted at `/api/orders`)
- ✅ All API routes present: products, orders, users, services, reviews, inventory, quotations, wishlist, analytics, audit-logs
- ✅ Authentication middleware configured (requireAuth, requireAdmin)
- ✅ Rate limiting and security headers in place

### Database Setup (REQUIRED)
- ⏳ Orders and order_items tables
- ⏳ Services seeded to database
- ⏳ Products linked to services

---

## 🚀 Final Setup Steps

### 1. Create Database Tables

Run this SQL in **Supabase SQL Editor** (`https://supabase.com/dashboard`):

```sql
-- ── Orders Table ────────────────────────────────────────
create table if not exists public.orders (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  status           text default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  subtotal         numeric(12,2) not null default 0,
  tax              numeric(12,2) not null default 0,
  shipping         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  shipping_address text,
  tracking         text,
  cancelled_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

-- ── Order Items Table ───────────────────────────────────
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

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert with check (auth.uid() = user_id);
```

### 2. Seed Services Data

Run this SQL in Supabase SQL Editor:

```sql
-- Insert services
INSERT INTO public.services (slug, name, tagline, description, icon, is_active, sort_order)
VALUES
  ('cctv-systems', 'CCTV Surveillance System', '4K AI-Powered Cameras with Remote Access', 'Professional video surveillance systems for round-the-clock monitoring with AI motion detection and night vision.', '📹', true, 1),
  ('access-control', 'Access Control System', 'Biometric & Smart Card Authentication', 'Biometric and smart card access systems for secure entry management with real-time monitoring.', '🔐', true, 2),
  ('alarm-systems', 'Wireless Alarm Security System', '4G + WiFi Detection with Instant Alerts', 'Advanced intrusion detection with 24/7 monitoring and instant mobile alerts.', '🚨', true, 3),
  ('fire-safety', 'Fire Alarm Systems', '500-Point Addressable Detection', 'Advanced fire detection and suppression systems compliant with BS5839 and international standards.', '🔥', true, 4),
  ('networking', 'Structured Cabling & Networking', 'Gigabit PoE Networks & NVR Integration', 'Enterprise networking infrastructure for reliable, high-performance connectivity and device integration.', '📡', true, 5),
  ('biometric', 'Biometric Authentication', 'Iris Recognition & Anti-Spoofing', 'Advanced iris and fingerprint recognition for high-security access to facilities.', '👁️', true, 6),
  ('time-tracking', 'Time & Attendance System', 'Touchless & RFID Attendance Tracking', 'Automated employee time tracking and attendance management with payroll integration.', '⏰', true, 7),
  ('electrical', 'Electrical Products & Installation', 'Full-Project Electrical Solutions', 'Complete electrical installation and equipment supply for all residential and commercial projects.', '⚡', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- Link existing products to services
UPDATE public.products SET service_id = 1 WHERE category ILIKE 'CCTV' AND service_id IS NULL;
UPDATE public.products SET service_id = 2 WHERE category ILIKE 'Access Control' AND service_id IS NULL;
UPDATE public.products SET service_id = 3 WHERE category ILIKE 'Alarms' AND service_id IS NULL;
UPDATE public.products SET service_id = 5 WHERE category ILIKE 'Networking' AND service_id IS NULL;
UPDATE public.products SET service_id = 6 WHERE category ILIKE 'Biometric' AND service_id IS NULL;

-- Verify
SELECT COUNT(*) FROM public.services;
SELECT COUNT(*) FROM public.products WHERE service_id IS NOT NULL;
```

### 3. Enable Admin User (Optional)

If you want to test admin features, set a user's role to 'admin' in Supabase:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

Get your user ID from Supabase Auth > Users.

### 4. Start Backend Server

```bash
cd backend
npm install  # if not already done
node server.js
```

Expected output:
```
✔ Proteam API running on http://localhost:4000 [development]
  Routes: products, orders, users, services, reviews, inventory, quotations, wishlist, analytics, audit-logs
```

### 5. Start Frontend (New Terminal)

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Navigate to `http://localhost:5173`

---

## 🧪 Testing Workflows

### User Flow: Browse → Add to Cart → Checkout

1. **Home Page** → Click a service card (e.g., "CCTV Surveillance")
2. **ServiceDetail Page** → View service details + related products
3. **Add to Cart** → Click "Add to Cart" on a product
4. **Cart Page** (`/cart`) → Review items
5. **Checkout** (`/checkout`) → Fill form and click "Order Now"
6. **Order Confirmation** → Shows order ID

### Admin Flow: Dashboard → Inventory → Orders

1. **Admin Dashboard** (`/admin/`) → View stats, revenue, pending orders
2. **Orders Page** (`/admin/orders/`) → List all orders with pagination
3. **Order Detail** (`/admin/orders/:id`) → View order items and customer info
4. **Inventory Page** (`/admin/inventory/`) → See low-stock alerts, update stock
5. **Analytics Page** (`/admin/reports/`) → Revenue by period, trending products

### Customer Flow: Place Order → View Order History

1. **My Account** (`/account/`) → Click "My Orders"
2. **Orders List** → View all personal orders
3. **Order Detail** → Check status and tracking

---

## 📋 API Endpoints Ready

### Orders (New)
- `POST /api/orders` — Create order
- `GET /api/orders/mine` — Customer's orders
- `GET /api/orders/:id/tracking` — Tracking info
- `POST /api/orders/:id/cancel` — Cancel order
- `GET /api/orders/stats` — Admin: Sales stats
- `GET /api/orders` — Admin: All orders
- `GET /api/orders/:id` — Admin: Order detail
- `PATCH /api/orders/:id/status` — Admin: Update status

### Services
- `GET /api/services` — List all services
- `GET /api/services/:id` — Service detail with related products

### Reviews, Inventory, Quotations, Analytics
- All endpoints already implemented and ready to use

---

## ⚠️ Troubleshooting

### Orders endpoint returns 404
- ✅ Backend has been updated. Ensure server is restarted: `node server.js`

### "Product not found" error on checkout
- Verify products exist in database: `SELECT COUNT(*) FROM public.products`
- Check product IDs in cart match database IDs

### Admin pages show no data
- Verify user has `role = 'admin'` in `profiles` table
- Check browser console for API errors
- Ensure backend is running and accessible

### Orders table doesn't exist
- Run SQL migration from Step 1 above in Supabase SQL Editor
- Check Supabase project is connected correctly

---

## 📚 File Locations

**Frontend Components:**
- Services list: `frontend/src/data/services.js`
- Services page: `frontend/src/pages/Services.jsx`
- Service detail: `frontend/src/pages/ServiceDetail.jsx`
- Checkout: `frontend/src/pages/Checkout.jsx`
- Admin dashboard: `frontend/src/pages/AdminDash.jsx`
- Inventory: `frontend/src/pages/Inventory.jsx`

**Backend Routes:**
- Orders API: `backend/src/routes/orders.js`
- Services API: `backend/src/routes/services.js`
- Server setup: `backend/server.js`

**Database:**
- Supabase project: `enckwlxvbrwphgbmpcbc.supabase.co`

---

## 🎯 What's Next?

After completing these steps, the system is production-ready for:
- ✅ Users browsing services and products
- ✅ Adding items to cart and checking out
- ✅ Admins managing orders and inventory
- ✅ Viewing analytics and reports
- ✅ Processing quotations and reviews

Happy coding! 🚀

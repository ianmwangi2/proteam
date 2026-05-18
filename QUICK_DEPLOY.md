# ⚡ Quick Deploy Checklist - Vercel + Render

## Before You Start
✅ Code committed to GitHub  
✅ Supabase database ready  
✅ Environment variables documented  

---

## Step 1: Get Your Credentials (5 min)

### From Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "Settings" → "API" 
4. Copy these values:
   - **Project URL:** `https://enckwlxvbrwphgbmpcbc.supabase.co`
   - **Anon Public Key:** `eyJ...` (starts with eyJ)
   - **Service Role Key:** `eyJ...` (labeled as Secret)

### Write them down:
```
ANON_KEY = ______________
SERVICE_ROLE_KEY = ______________
PROJECT_URL = https://enckwlxvbrwphgbmpcbc.supabase.co
```

---

## Step 2: Deploy Frontend to Vercel (8 min)

### 2.1 Go to [vercel.com](https://vercel.com)
- Sign in with GitHub
- Click "Add New +" → "Project"
- Select your `proteam` repository
- Click "Import"

### 2.2 Configure Project
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```
✅ Leave Node version as default

### 2.3 Add Environment Variables
Click "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://proteam-api.onrender.com` |
| `VITE_SUPABASE_URL` | `https://enckwlxvbrwphgbmpcbc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *paste your anon key from step 1* |

### 2.4 Click "Deploy" 
⏳ Wait 2-3 minutes for build to complete  
✅ You'll see a green checkmark when done

**Your frontend is now live at:** `https://proteam.vercel.app`

---

## Step 3: Deploy Backend to Render (8 min)

### 3.1 Go to [render.com](https://render.com)
- Sign in with GitHub
- Click "New +" → "Web Service"
- Select your `proteam` repository
- Click "Connect"

### 3.2 Configure Service
```
Name: proteam-api
Branch: main
Runtime: Node
Build Command: npm install --prefix backend
Start Command: node backend/server.js
Root Directory: (leave blank)
Node Version: 18
```

### 3.3 Add Environment Variables
Click "Advanced" → "Add Environment Variable"

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `SUPABASE_URL` | `https://enckwlxvbrwphgbmpcbc.supabase.co` |
| `SUPABASE_ANON_KEY` | *paste anon key from step 1* |
| `SUPABASE_SERVICE_ROLE_KEY` | *paste service role key from step 1* |
| `CORS_ORIGIN` | `https://proteam.vercel.app` |

### 3.4 Click "Create Web Service"
⏳ Wait 3-5 minutes for deployment  
✅ You'll see "Live" when complete

**Your backend is now live at:** `https://proteam-api.onrender.com`

---

## Step 4: Database Setup (3 min)

### 4.1 Create Orders Table
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "SQL Editor" (left sidebar)
3. Click "New Query"
4. Copy this entire script:

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

5. Click "RUN"
6. Wait for confirmation

✅ Orders tables are now created

---

## Step 5: Test the Deployment (3 min)

### 5.1 Test Frontend
1. Open `https://proteam.vercel.app` in browser
2. Check if page loads without errors
3. Open DevTools (F12) → Console
4. Should see NO red errors

### 5.2 Test API Health
1. Open new tab, go to: `https://proteam-api.onrender.com/api/health`
2. Should see: `{"status":"ok","timestamp":"..."}`

### 5.3 Test User Flow
1. Go to `https://proteam.vercel.app`
2. Click any service card
3. Click "Request Quotation"
4. Fill form and submit
5. Should not see any errors

### 5.4 Test Admin Dashboard
1. Go to `https://proteam.vercel.app/account`
2. Sign in with test account
3. If admin, click "Admin" in navbar
4. Dashboard should load with quotations data

---

## If Something Goes Wrong

### Frontend won't build
```
❌ Error: VITE_API_URL not set
✅ Fix: Add environment variable in Vercel project settings
```

### Backend won't start
```
❌ Error: SUPABASE_SERVICE_ROLE_KEY not found
✅ Fix: Check all env vars are copied correctly in Render
```

### CORS Error on frontend
```
❌ Error: Access to XMLHttpRequest blocked by CORS
✅ Fix: Make sure CORS_ORIGIN=https://proteam.vercel.app in backend .env
```

### Database error
```
❌ Error: relation "orders" does not exist
✅ Fix: Run the SQL migrations from Step 4
```

---

## Verify Deployment Checklist

- [ ] Frontend loads at `https://proteam.vercel.app` (green checkmark)
- [ ] No console errors on frontend
- [ ] Backend responds at `/api/health` with status ok
- [ ] Services list loads from `/api/services`
- [ ] Can sign in at `/account`
- [ ] Dashboard loads at `/admin`
- [ ] Quotations page shows at `/admin/quotations`
- [ ] No CORS errors in browser console
- [ ] No red errors in Render logs

---

## Next Steps (Optional)

### Get a Custom Domain
1. Buy domain from GoDaddy, Namecheap, etc.
2. **Vercel:** Project Settings → Domains → Add domain
3. **Render:** Service Settings → Custom Domain → Add domain
4. Update DNS records (follow platform instructions)

### Setup Email Notifications
1. Configure your email service (SendGrid, Mailgun, etc.)
2. Add environment variables for email API keys
3. Update contact/quotation endpoints to send emails

### Monitor Performance
1. Vercel Dashboard → Analytics
2. Render Dashboard → Metrics
3. Supabase Dashboard → Logs

---

## Your Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | `https://proteam.vercel.app` | 🟢 |
| Backend | `https://proteam-api.onrender.com` | 🟢 |
| Database | Supabase | 🟢 |

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs  
- **Supabase Docs:** https://supabase.com/docs
- **Express Docs:** https://expressjs.com

---

**Deployment Status: ✅ READY TO DEPLOY**

Start with Step 1 and follow through Step 5!

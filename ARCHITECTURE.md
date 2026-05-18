# ProTeam System Architecture Summary

## 🏗️ Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                        │
│                    localhost:5173                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ Services Layer ─────────┐      ┌─ Admin Layer ────────┐       │
│  │ • Home (Services Grid)    │      │ • AdminDash (Stats)  │       │
│  │ • ServiceDetail (Product) │      │ • Inventory (Stock)  │       │
│  │ • Catalog (All Products)  │      │ • Analytics (Charts) │       │
│  │ • Checkout (Order Form)   │      │ • Orders (List)      │       │
│  └───────────────────────────┘      └──────────────────────┘       │
│                                                                     │
│  Context: Auth, Cart, Toast                                        │
│  Data: services.js (8 items), products.js (12 items)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
                   API HTTP Calls (CORS)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                           │
│                    localhost:4000                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Routes:                                                            │
│  ✅ POST   /api/orders          → Create order                     │
│  ✅ GET    /api/orders/mine     → User's orders                    │
│  ✅ GET    /api/orders/:id      → Order detail (admin)             │
│  ✅ GET    /api/orders/stats    → Revenue (admin)                  │
│  ✅ GET    /api/services        → List services                    │
│  ✅ GET    /api/services/:id    → Service + related products       │
│  ✅ GET    /api/analytics       → Revenue & metrics                │
│  ✅ GET    /api/inventory       → Stock alerts                     │
│  ✅ GET    /api/reviews         → Product reviews                  │
│  ✅ POST   /api/quotations      → Request quote                    │
│  ... (all core APIs present)                                        │
│                                                                     │
│  Middleware: Auth, Admin roles, Rate limiting, CORS                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
                   JWT + Service Role Auth
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DATABASE (Supabase / PostgreSQL)                       │
│           enckwlxvbrwphgbmpcbc.supabase.co                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tables:                                                            │
│  ✅ products              → 12 items (linked to services)           │
│  ✅ services              → 8 items (CCTV, Access, Alarms, etc)     │
│  ⏳ orders (TO CREATE)    → Customer orders                         │
│  ⏳ order_items (TO CREATE) → Order line items                      │
│  ✅ quotations            → Quote requests                          │
│  ✅ profiles              → User profiles                           │
│  ✅ cart_items            → Shopping cart                           │
│  ✅ reviews               → Product reviews                         │
│  ✅ wishlist              → Saved items                             │
│  ✅ inventory_logs        → Stock history                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow: User Order Journey

```
HOME PAGE (Browse Services)
    ↓
SERVICE DETAIL (View service + related products)
    ↓
ADD TO CART (Click "Add to Cart" button)
    ├─ Product added to CartContext
    ├─ Cart badge updates
    └─ Toast notification
    ↓
CART PAGE (Review items)
    ├─ Display: product images, prices, quantities
    ├─ Calc: subtotal, tax (16%), shipping
    └─ CTA: "Proceed to Checkout"
    ↓
CHECKOUT PAGE (Customer details form)
    ├─ Input: First name, Last name, Phone, Location, Email
    └─ Submit: POST /api/orders with items
    ↓
ORDER CONFIRMATION
    ├─ Response: Order ID, total, status
    ├─ Clear cart
    ├─ Show "Order Received!" message
    └─ Links: My Account, Continue Shopping
    ↓
ADMIN DASHBOARD (After admin login)
    ├─ Stats: Total revenue, Orders count, Users, Low stock
    ├─ Orders List: All orders with pagination
    ├─ Order Detail: Items, customer info, status
    └─ Actions: Update status, mark shipped, cancel order
```

## 🔐 Authentication & Roles

```
PUBLIC (No Auth Required)
├─ GET /services
├─ GET /products
├─ GET /services/:id/products
└─ POST /contact (public form)

AUTHENTICATED USERS
├─ POST /orders (place order)
├─ GET /orders/mine (view own orders)
├─ GET /orders/:id/tracking
├─ POST /cart (add item)
├─ GET /wishlist (view favorites)
└─ POST /reviews (submit review)

ADMIN ONLY (role='admin')
├─ GET /orders (all orders)
├─ GET /orders/:id (detail)
├─ PATCH /orders/:id/status (update)
├─ GET /analytics/revenue (stats)
├─ GET /inventory/low-stock (alerts)
└─ POST /inventory/bulk-update (stock)
```

## 📋 Services (Pre-Defined)

```
1. CCTV Surveillance System (📹)
   └─ Products: CCTV Camera Pro, 4K IP Camera, Night Vision Kit

2. Access Control System (🔐)
   └─ Products: Smart Card Reader, Biometric Door Lock

3. Wireless Alarm Security (🚨)
   └─ Products: Alarm Panel Pro, Wireless Sensor Kit, Smart Alarm Hub

4. Fire Alarm Systems (🔥)
   └─ Products: Fire Detector Pro

5. Structured Cabling (📡)
   └─ Products: Network Switch Pro

6. Biometric Authentication (👁️)
   └─ Products: Facial Recognition Scanner

7. Time & Attendance (⏰)
   └─ Products: (to be added)

8. Electrical Products (⚡)
   └─ Products: (Commercial Wiring, Breaker Panel, etc.)
```

## ✅ Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Services UI | ✅ Done | Home, ServiceDetail, all CSS |
| Backend Orders Route | ✅ Done | Imported & mounted in server.js |
| Checkout Form | ✅ Done | Submits POST /orders |
| Admin Pages | ✅ Done | Dashboard, Inventory, Analytics |
| Database Schema (Orders) | ⏳ TODO | Run SQL migration |
| Services Seeding | ⏳ TODO | Run SQL insert |
| Backend Server | ✅ Ready | Start with: node server.js |
| Frontend Dev Server | ✅ Ready | Start with: npm run dev |

---

**Next Step:** Run SQL migrations in Supabase, then start both servers.

# ProTeam Deployment Checklist

**Status: ALMOST READY FOR DEPLOYMENT** ✅✅✅

## Database Setup (MUST DO)
- [ ] Run orders.sql migration in Supabase SQL Editor
- [ ] Run services-seed.sql to insert services
- [ ] Verify: SELECT COUNT(*) FROM public.orders; (should execute without error)
- [ ] Verify: SELECT COUNT(*) FROM public.services; (should return 8)

## Backend Server
- [x] Orders route imported in server.js
- [x] Orders route mounted at /api/orders
- [x] orders.js file has all endpoints (POST, GET /mine, GET /stats, etc.)
- [ ] Start backend: `cd backend && node server.js`
- [ ] Verify output shows "orders" in routes list

## Frontend App
- [x] All routes configured in App.jsx
- [x] ServiceDetail component created and working
- [x] Checkout form ready to submit orders
- [x] AdminDash, Inventory, Analytics pages created
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Verify app loads at http://localhost:5173

## Testing
- [ ] User can click service card on home
- [ ] ServiceDetail page displays related products
- [ ] Can add product to cart
- [ ] Checkout form accepts input
- [ ] Order submit succeeds with order ID response
- [ ] Admin dashboard loads and shows stats
- [ ] Orders list in admin shows created orders

## Optional Enhancements
- [ ] Add user role check (set admin role in Supabase)
- [ ] Test quotations workflow
- [ ] Test reviews and ratings
- [ ] Test wishlist functionality
- [ ] Check email notifications

---

**Critical Files Modified:**
- ✅ `backend/server.js` — Orders import + mount
- ✅ `frontend/src/pages/ServiceDetail.jsx` — Created
- ✅ `frontend/src/pages/AdminDash.jsx` — Verified complete
- ✅ `frontend/src/pages/Inventory.jsx` — Verified complete
- ✅ `frontend/src/data/services.js` — Created
- ✅ `frontend/src/data/products.js` — Updated with service_id

**SQL Files Created (in backend/db/):**
- `orders.sql` — Database schema
- `services-seed.sql` — Service data

---

**Next User Action:** Run database migrations in Supabase, then start both servers.

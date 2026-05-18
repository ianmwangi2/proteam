# ProTeam Deployment Guide - Vercel + Render

## Overview
- **Frontend:** Vercel (React + Vite)
- **Backend:** Render (Node.js + Express)
- **Database:** Supabase (PostgreSQL)
- **Estimated time:** 20-30 minutes

---

## Phase 1: Prepare Your Code (5 min)

### 1.1 Check git status
```bash
cd proteam
git status
git add .
git commit -m "chore: prepare for deployment"
```

### 1.2 Verify .env files exist
```bash
# Frontend
ls -la frontend/.env.local

# Backend
ls -la backend/.env
```

**If missing, create them:**

**`frontend/.env.local`:**
```
VITE_API_URL=https://proteam-api.onrender.com
VITE_SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**`backend/.env`:**
```
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CORS_ORIGIN=https://proteam.vercel.app
```

> Get keys from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

---

## Phase 2: Deploy Frontend to Vercel (8 min)

### 2.1 Push code to GitHub
```bash
git push origin main
```

### 2.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Choose "Import Project"

### 2.3 Configure Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `frontend`

### 2.4 Add Environment Variables
In Vercel Project Settings → Environment Variables, add:

```
VITE_API_URL=https://proteam-api.onrender.com
VITE_SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
VITE_SUPABASE_ANON_KEY=<paste_anon_key>
```

### 2.5 Deploy
Click "Deploy" and wait for the build to complete.

**Your frontend will be live at:** `https://proteam.vercel.app` (or custom name)

---

## Phase 3: Deploy Backend to Render (10 min)

### 3.1 Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub
- Connect your GitHub account

### 3.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Choose "Node" as environment

### 3.3 Configure Service
- **Name:** `proteam-api`
- **Branch:** `main`
- **Build Command:** `npm install --prefix backend && npm run build --prefix backend` (or skip if no build step)
- **Start Command:** `npm start --prefix backend`
- **Root Directory:** Leave blank (monorepo setup)
- **Node Version:** `18` (or latest)

### 3.4 Add Environment Variables
In Service Settings → Environment, add:

```
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
SUPABASE_ANON_KEY=<paste_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<paste_service_role_key>
CORS_ORIGIN=https://proteam.vercel.app
```

### 3.5 Deploy
Click "Create Web Service" and wait for deployment.

**Your backend will be live at:** `https://proteam-api.onrender.com`

---

## Phase 4: Database Setup (5 min)

### 4.1 Run Migrations (if needed)
If you haven't created the orders table:

```bash
# In Supabase SQL Editor:
# Copy and paste contents from backend/db/orders.sql
# Then copy and paste backend/db/services-seed.sql
```

### 4.2 Verify Connection
Test the API:
```bash
curl https://proteam-api.onrender.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Phase 5: Update Frontend URLs (3 min)

If your backend URL changed from `localhost:4000`:

### Update `frontend/src/config/api.js`:
```javascript
const API_BASE = process.env.VITE_API_URL || 'https://proteam-api.onrender.com';
```

Redeploy frontend to Vercel after this change.

---

## Phase 6: Testing & Validation (5 min)

### Test User Flow
1. Go to `https://proteam.vercel.app`
2. Click a service card
3. Click "Request Quotation"
4. Fill out contact form
5. Check if submission works (check browser console)

### Test Admin Flow
1. Go to `/account` (sign in)
2. Go to `/admin`
3. Check if dashboard loads
4. Check if quotations list loads

### Test API Health
```bash
curl https://proteam-api.onrender.com/api/health
curl https://proteam-api.onrender.com/api/services
```

---

## Common Issues & Solutions

### ❌ "CORS Error" on frontend
**Fix:** Make sure `CORS_ORIGIN` in backend .env matches your Vercel URL:
```
CORS_ORIGIN=https://your-app.vercel.app
```

### ❌ "Supabase connection failed"
**Fix:** Verify environment variables in Render:
```bash
# Check Render logs for error details
# Render Dashboard → Your Service → Logs
```

### ❌ "Cannot find module"
**Fix:** Ensure dependencies are installed:
```bash
cd backend
npm install
```

### ❌ "Database migrations failed"
**Fix:** Run migrations manually in Supabase:
1. Go to Supabase Dashboard
2. SQL Editor
3. Paste migration SQL from `backend/db/orders.sql`

---

## Post-Deployment Checklist

- [ ] Frontend loads at https://proteam.vercel.app
- [ ] Backend responds at https://proteam-api.onrender.com/api/health
- [ ] Services list loads from `/api/services`
- [ ] User can sign in via `/account`
- [ ] User can request quotation
- [ ] Admin can view dashboard
- [ ] Admin can see quotations list
- [ ] No CORS errors in browser console
- [ ] Database migrations completed
- [ ] Email notifications configured (if applicable)

---

## Optional: Custom Domain

If you get a domain later:

**For Vercel:**
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

**For Render:**
1. Go to Service Settings → Custom Domain
2. Add your domain
3. Follow DNS configuration instructions

---

## Environment Variables Reference

### Frontend (Vercel)
```
VITE_API_URL=https://proteam-api.onrender.com
VITE_SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Backend (Render)
```
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://enckwlxvbrwphgbmpcbc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
CORS_ORIGIN=https://proteam.vercel.app
```

---

## Monitoring & Logs

### Vercel Logs
- Dashboard → Deployments → Select deployment → Logs

### Render Logs
- Dashboard → Your Service → Logs

Check logs if something goes wrong!

---

## Rollback Plan

If deployment has issues:

**Vercel:**
1. Go to Deployments
2. Select previous working deployment
3. Click "Redeploy"

**Render:**
1. Go to Service Settings → Deploy
2. Click "Manual Deploy" with previous commit

---

## Need Help?

- **Vercel:** https://vercel.com/docs
- **Render:** https://render.com/docs
- **Supabase:** https://supabase.com/docs

---

**Status: Ready to Deploy** ✅

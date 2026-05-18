# Deployment Troubleshooting Guide

## Common Errors & Solutions

---

## Frontend (Vercel) Issues

### ❌ Build Failed - "Cannot find module 'react'"

**Cause:** Dependencies not installed  
**Solution:**
```bash
cd frontend
npm install
npm run build  # Test locally first
git push  # Push to GitHub
# Redeploy in Vercel
```

---

### ❌ "VITE_API_URL is not defined"

**Cause:** Environment variable not set in Vercel  
**Solution:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   ```
   VITE_API_URL = https://proteam-api.onrender.com
   VITE_SUPABASE_URL = https://enckwlxvbrwphgbmpcbc.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```
5. Redeploy

---

### ❌ "Blank page" or 404 errors

**Cause:** Routes not configured correctly  
**Solution:**
1. Check `frontend/src/App.jsx` has all routes
2. Check console for JavaScript errors (F12)
3. Verify API is responding: `https://proteam-api.onrender.com/api/health`

---

### ❌ "Cannot load images"

**Cause:** Static assets not in correct folder  
**Solution:**
```bash
# Images should be in frontend/public/
ls frontend/public/
# Then reference as: /image.png (relative path)
```

---

## Backend (Render) Issues

### ❌ Deployment Timeout (>30 min)

**Cause:** npm install taking too long  
**Solution:**
1. Delete `node_modules/` and `package-lock.json`
2. Push to GitHub
3. Render will reinstall
4. If still slow, use Render's Docker option

---

### ❌ "SUPABASE_SERVICE_ROLE_KEY not found"

**Cause:** Environment variable missing  
**Solution:**
1. Go to Render Dashboard
2. Select "proteam-api" service
3. Environment → Add all variables:
   ```
   SUPABASE_URL = https://enckwlxvbrwphgbmpcbc.supabase.co
   SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY = eyJ...
   ```
4. Save and auto-redeploy

---

### ❌ "Port 4000 already in use"

**Cause:** Port conflict on Render  
**Solution:**
1. This shouldn't happen on Render (managed service)
2. Render auto-assigns PORT in environment
3. Check logs for actual error

---

### ❌ "Cannot connect to Supabase" (ECONNREFUSED)

**Cause:** Wrong URL or API key  
**Solution:**
```bash
# Test locally first
curl "https://enckwlxvbrwphgbmpcbc.supabase.co/rest/v1/services"

# Check environment variables have no extra spaces
# Verify API keys are complete (usually 200+ characters)
```

---

## CORS Issues

### ❌ "Access to XMLHttpRequest blocked by CORS"

**Frontend Console Error:**
```
Access to XMLHttpRequest at 'https://proteam-api.onrender.com/api/services'
from origin 'https://proteam.vercel.app' has been blocked by CORS policy
```

**Cause:** Backend CORS_ORIGIN doesn't match frontend URL  
**Solution:**

1. Go to Render Dashboard
2. Select "proteam-api" service
3. Environment Variables
4. Check `CORS_ORIGIN`:
   ```
   CORS_ORIGIN = https://proteam.vercel.app
   ```
5. Make sure it matches your exact frontend URL (no trailing slash)
6. Render will auto-restart with new settings

**Check it's working:**
```bash
curl -H "Origin: https://proteam.vercel.app" \
     https://proteam-api.onrender.com/api/health
# Should return JSON without CORS errors
```

---

## Database Issues

### ❌ "relation 'orders' does not exist"

**Cause:** Database migrations not run  
**Solution:**

1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire script from `backend/db/orders.sql`
4. Click RUN
5. Wait for confirmation

---

### ❌ "Authentication required" or RLS errors

**Cause:** Row-Level Security policy blocking queries  
**Solution:**

Check the admin user has `role='admin'`:
```sql
-- In Supabase SQL Editor
SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- If no results, set your user as admin:
UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
```

---

## Connection Testing

### Test Frontend → Backend Connection

**Method 1: Browser DevTools**
1. Open `https://proteam.vercel.app`
2. Press F12 (DevTools)
3. Go to Network tab
4. Reload page
5. Look for API calls to `https://proteam-api.onrender.com`
6. If red ❌ = CORS or connection issue
7. If 200 ✅ = Working!

**Method 2: curl from terminal**
```bash
# Test API health
curl https://proteam-api.onrender.com/api/health

# Should return:
# {"status":"ok","timestamp":"2024-..."}

# Test services list
curl https://proteam-api.onrender.com/api/services

# Should return JSON array with services
```

**Method 3: Browser console**
```javascript
// Open browser DevTools → Console
// Paste this:
fetch('https://proteam-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ API Working:', d))
  .catch(e => console.error('❌ API Error:', e))
```

---

## Performance Issues

### ❌ Site loads slowly (>3 seconds)

**Causes:**
1. Render free tier = slower CPU
2. Supabase query slow
3. Large bundle size

**Solutions:**
```bash
# Check frontend bundle size
cd frontend
npm run build
ls -lh dist/index.html  # Should be <500KB

# Check backend response time
time curl https://proteam-api.onrender.com/api/services

# If slow, check Render logs for database queries
```

**Upgrade Options:**
- Render: Starter plan ($5/month) for faster deployment
- Supabase: Add better indexes to database

---

## Environment Variables Not Updating

### ❌ "Code change doesn't reflect"

**Cause:** Cached environment or old build  
**Solution:**

**For Vercel:**
1. Settings → Git → Redeply
2. Select previous successful deployment
3. Click "Redeploy"

**For Render:**
1. Manual Deploy tab
2. Select the git branch
3. Click "Deploy"

**For local testing:**
```bash
# Stop running servers (Ctrl+C)
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Restart with fresh environment
npm run dev  # or npm start
```

---

## GitHub Connection Issues

### ❌ "Repository not found" on Vercel/Render

**Cause:** GitHub permission not granted  
**Solution:**
1. Go to GitHub → Settings → Applications
2. Find Vercel/Render in "Authorized OAuth Apps"
3. Click → Grant access to your repository

---

## When Everything Fails

### Nuclear Option: Full Redeploy

**If nothing above works:**

1. **Delete old deployments**
   - Vercel: Settings → Delete project
   - Render: Delete service

2. **Commit clean code**
   ```bash
   cd proteam
   git status
   git add .
   git commit -m "chore: clean deploy"
   git push origin main
   ```

3. **Redeploy from scratch**
   - Follow QUICK_DEPLOY.md again
   - All new environment variables
   - Fresh Vercel/Render project

---

## Checking Service Status

### Vercel Status
```bash
# Check if deployment is live
curl -I https://proteam.vercel.app
# Should return: HTTP 200

# Check redirect is working
curl -L https://proteam.vercel.app
# Should return HTML content
```

### Render Status
```bash
# Check backend is responding
curl https://proteam-api.onrender.com/api/health

# Check it's listening on port 4000
# (Render abstracts this, but log should show listening)
```

### Supabase Status
- Go to supabase.com/dashboard
- Your project → Health tab
- All systems should be green

---

## Getting Help

### 1. Check Logs First
- **Vercel:** Deployments → Click deployment → Logs
- **Render:** Service → Logs tab (live stream)
- **Supabase:** Logs tab shows all queries

### 2. Search Error Message
```
Copy exact error message
Paste in Google
Usually Stack Overflow has answer
```

### 3. Check Platform Docs
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Supabase: https://supabase.com/docs

### 4. Community Help
- Stack Overflow: Tag your question
- GitHub Issues: Check existing issues
- Discord: Join platform community servers

---

## Monitoring Checklist

After deployment goes live:

- [ ] Check logs daily for errors
- [ ] Monitor response times
- [ ] Set up uptime monitoring (https://uptime.com - free)
- [ ] Get email alerts for errors
- [ ] Monitor database size growth

---

## Success Indicators

When you see these, everything is working:

```
✅ curl returns 200 status
✅ Frontend loads instantly
✅ No red errors in console
✅ API responds in <500ms
✅ Database queries complete
✅ Users can sign in
✅ Admin dashboard shows data
✅ No alerts from monitoring service
```

---

## Emergency Contacts

**If critical issue:**

1. **Frontend down** → Vercel Support (vercel.com/support)
2. **Backend down** → Render Support (render.com/support)
3. **Database down** → Supabase Support (supabase.com/support)

All have live chat in dashboards!

---

*Bookmark this page for reference during deployment!* 🔖

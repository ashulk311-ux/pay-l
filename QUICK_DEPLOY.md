# Quick Deployment Guide

## TL;DR - Deploy in 10 Minutes

### Backend on Render

1. **Create Database:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - New + → PostgreSQL
   - Name: `payroll-db`, Plan: Starter
   - Copy database credentials

2. **Create Web Service:**
   - New + → Web Service
   - Connect GitHub repo
   - Settings:
     - **Name**: `payroll-backend`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=<from-database>
   DB_PORT=5432
   DB_NAME=payroll_db
   DB_USER=<from-database>
   DB_PASSWORD=<from-database>
   JWT_SECRET=<generate-random-string>
   JWT_EXPIRE=7d
   FRONTEND_URL=<update-after-frontend-deploy>
   CORS_ORIGIN=<update-after-frontend-deploy>
   ```

4. **Deploy** → Copy backend URL

### Frontend on Vercel

1. **Import Project:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Add New → Project
   - Import GitHub repo

2. **Configure:**
   - **Root Directory**: `frontend` ⚠️ **CRITICAL: Must set this!**
   - **Framework**: Create React App (auto-detected)
   - **Build Command**: Leave empty (uses default: `npm run build`)
   - **Output Directory**: Leave empty (uses default: `build`)
   - **Install Command**: Leave empty (uses default: `npm install`)

3. **Set Environment Variable:**
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

4. **Deploy** → Copy frontend URL

5. **Update Backend CORS:**
   - Go back to Render
   - Update `FRONTEND_URL` and `CORS_ORIGIN` with Vercel URL
   - Redeploy backend

### Done! 🎉

Your app is live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`

## Next Steps

1. Run database migrations (see DEPLOYMENT.md)
2. Create admin user
3. Test login and functionality

## Troubleshooting

**Backend won't start?**
- Check database credentials
- **Set `JWT_SECRET`** (required, min 16 chars) — missing it causes startup to fail with a clear message
- Verify SSL is enabled in database config
- Check Render logs

**500 on `/api/auth/login`?**
- Ensure **`JWT_SECRET`** is set in Render Environment (min 16 characters). If missing, login will return 500.
- Check Render service logs for the exact error (database, JWT, etc.)

**Frontend can't connect to API?**
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Look for errors in browser console

**Database connection errors?**
- Ensure using internal database host (not external)
- Verify SSL configuration
- Check database is in same region

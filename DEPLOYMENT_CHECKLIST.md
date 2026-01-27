# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented
- [ ] Database migrations are ready
- [ ] No hardcoded localhost URLs in code
- [ ] CORS configuration is flexible (uses env vars)

## Backend (Render) Setup

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created PostgreSQL database on Render
- [ ] Created Web Service on Render
- [ ] Set Root Directory to `backend`
- [ ] Configured Build Command: `npm install`
- [ ] Configured Start Command: `npm start`
- [ ] Set all required environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `DB_HOST` (from database)
  - [ ] `DB_PORT=5432`
  - [ ] `DB_NAME=payroll_db`
  - [ ] `DB_USER` (from database)
  - [ ] `DB_PASSWORD` (from database)
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `JWT_EXPIRE=7d`
  - [ ] `FRONTEND_URL` (will update after frontend deploy)
  - [ ] `CORS_ORIGIN` (will update after frontend deploy)
- [ ] First deployment successful
- [ ] Health check endpoint works: `/health`
- [ ] Database connection successful

## Frontend (Vercel) Setup

- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Set Root Directory to `frontend`
- [ ] Framework Preset: Create React App
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Set environment variable:
  - [ ] `REACT_APP_API_URL` (backend URL from Render)
- [ ] First deployment successful
- [ ] Frontend loads without errors

## Post-Deployment

- [ ] Updated backend `FRONTEND_URL` with Vercel URL
- [ ] Updated backend `CORS_ORIGIN` with Vercel URL
- [ ] Backend redeployed with updated CORS
- [ ] Database migrations run successfully
- [ ] Initial data seeded (if needed)
- [ ] Super Admin user created
- [ ] Test login works
- [ ] Test API calls from frontend
- [ ] CORS errors resolved
- [ ] SSL certificates active (automatic on both platforms)

## Testing

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] Login functionality works
- [ ] API calls succeed (check browser console)
- [ ] No CORS errors in console
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] Email sending works (if configured)

## Security

- [ ] All `.env` files in `.gitignore`
- [ ] Strong JWT secret generated
- [ ] Database password is secure
- [ ] CORS restricted to frontend domain
- [ ] HTTPS enabled (automatic)
- [ ] No sensitive data in logs
- [ ] Rate limiting active

## Monitoring

- [ ] Render logs accessible
- [ ] Vercel logs accessible
- [ ] Error tracking set up (optional)
- [ ] Database monitoring enabled

## Documentation

- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Team members have access
- [ ] Backup procedures documented

## Rollback Plan

- [ ] Know how to rollback on Render
- [ ] Know how to rollback on Vercel
- [ ] Database backup strategy in place

---

**Quick Links:**
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Backend Health: `https://your-backend.onrender.com/health`
- Frontend URL: `https://your-app.vercel.app`

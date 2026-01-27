# Deployment Guide

This guide covers deploying the Payroll Application to Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub account with repository access
- Render account (free tier available)
- Vercel account (free tier available)
- PostgreSQL database (Render provides this)

## Backend Deployment on Render

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing this project

### Step 2: Configure Web Service

**Basic Settings:**
- **Name**: `payroll-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users (e.g., `Oregon`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Create PostgreSQL Database

1. In Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `payroll-db`
   - **Database**: `payroll_db`
   - **User**: `payroll_user`
   - **Region**: Same as web service
   - **Plan**: `Starter` (free tier)

### Step 4: Configure Environment Variables

In your Render Web Service settings, add these environment variables:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
DB_HOST=<from-database-internal-host>
DB_PORT=5432
DB_NAME=payroll_db
DB_USER=payroll_user
DB_PASSWORD=<from-database-password>
JWT_SECRET=<generate-a-strong-secret>
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Optional Variables:**
```
ENABLE_AUTO_BACKUP=false
ENABLE_SWAGGER=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Getting Database Credentials:**
- Go to your PostgreSQL database in Render
- Copy the "Internal Database URL" or individual connection details
- Use the internal hostname (not external) for `DB_HOST`

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete
4. Copy your backend URL (e.g., `https://payroll-backend.onrender.com`)

### Step 6: Update Database Configuration for SSL

The database connection needs SSL in production. Update `backend/src/config/database.js`:

```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME || 'payroll_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    // ... rest of config
  }
);
```

## Frontend Deployment on Vercel

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository

### Step 2: Configure Project Settings

**Framework Preset:**
- **Framework**: `Create React App`

**Build Settings:**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables

Add the following environment variable:

```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

Replace `your-backend.onrender.com` with your actual Render backend URL.

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Wait for deployment to complete
4. Copy your frontend URL (e.g., `https://payroll-app.vercel.app`)

### Step 5: Update Backend CORS

After getting your Vercel frontend URL, update the backend environment variable:

1. Go back to Render Dashboard
2. Edit your web service
3. Update `FRONTEND_URL` and `CORS_ORIGIN` to your Vercel URL
4. Redeploy the backend

## Post-Deployment Steps

### 1. Run Database Migrations

Connect to your Render database and run migrations:

```bash
# Option 1: Using Render Shell
# Go to your web service → Shell
cd backend
npm run migrate

# Option 2: Using local connection
# Get external database URL from Render
# Connect using psql or pgAdmin
```

### 2. Seed Initial Data (Optional)

If you have seed scripts:

```bash
# In Render Shell
cd backend
npm run seed
```

### 3. Create Super Admin User

You'll need to create the initial super admin user. You can:

1. Use the database directly
2. Create a script to insert the user
3. Use the API endpoint if available

### 4. Verify Deployment

1. **Backend Health Check**: Visit `https://your-backend.onrender.com/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend**: Visit your Vercel URL
   - Should load the login page
   - Try logging in with your admin credentials

3. **API Connection**: Check browser console for API errors
   - Ensure CORS is properly configured
   - Verify API URL is correct

## Troubleshooting

### Backend Issues

**Database Connection Errors:**
- Verify database credentials in environment variables
- Ensure SSL is enabled in database config
- Check database is in same region as web service

**Build Failures:**
- Check build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible

**Port Issues:**
- Render uses port `10000` by default
- Ensure `PORT` environment variable is set correctly

### Frontend Issues

**API Connection Errors:**
- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend URL is accessible

**Build Failures:**
- Check build logs in Vercel dashboard
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors

**Environment Variables:**
- Vercel requires `REACT_APP_` prefix for React env vars
- Redeploy after changing environment variables

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `10000` |
| `DB_HOST` | Yes | Database host | `dpg-xxxxx-a.oregon-postgres.render.com` |
| `DB_PORT` | Yes | Database port | `5432` |
| `DB_NAME` | Yes | Database name | `payroll_db` |
| `DB_USER` | Yes | Database user | `payroll_user` |
| `DB_PASSWORD` | Yes | Database password | `****` |
| `JWT_SECRET` | Yes | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRE` | No | JWT expiration | `7d` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `https://app.vercel.app` |
| `CORS_ORIGIN` | Yes | CORS origin | `https://app.vercel.app` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_API_URL` | Yes | Backend API URL | `https://backend.onrender.com/api` |

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT secrets** - Generate random strings
3. **Enable HTTPS** - Both Render and Vercel provide this automatically
4. **Database SSL** - Always use SSL for production databases
5. **CORS** - Restrict to your frontend domain only

## Cost Considerations

### Render (Free Tier)
- 750 hours/month of web service runtime
- 90 days of database persistence
- Automatic SSL certificates
- Custom domains supported

### Vercel (Free Tier)
- Unlimited deployments
- Automatic SSL certificates
- Custom domains supported
- 100GB bandwidth/month

## Support

For issues:
1. Check deployment logs in respective dashboards
2. Review error messages in browser console
3. Verify environment variables are set correctly
4. Check database connectivity

# Vercel Deployment Setup Guide

## Important: Root Directory Configuration

The **most common issue** with Vercel deployment is not setting the Root Directory correctly.

## Step-by-Step Setup

### 1. Import Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository

### 2. Configure Project Settings

**⚠️ CRITICAL STEP - Root Directory:**

1. In the project settings, scroll to **"Root Directory"**
2. Click **"Edit"** or **"Override"**
3. Set it to: `frontend`
4. Click **"Save"**

**Why this is important:**
- Without setting Root Directory, Vercel tries to build from the repository root
- The build command `cd frontend` fails because Vercel's build environment may not have the same directory structure
- Setting Root Directory to `frontend` makes Vercel treat that folder as the project root

### 3. Build Settings (After Root Directory is Set)

Once Root Directory is set to `frontend`, you can use these settings:

- **Framework Preset**: `Create React App` (auto-detected)
- **Build Command**: Leave empty (defaults to `npm run build`)
- **Output Directory**: Leave empty (defaults to `build`)
- **Install Command**: Leave empty (defaults to `npm install`)

OR explicitly set:
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 4. Environment Variables

Add the following environment variable:

```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

Replace `your-backend.onrender.com` with your actual Render backend URL.

### 5. Deploy

Click **"Deploy"** and wait for the build to complete.

## Troubleshooting

### Error: "cd frontend: No such file or directory"

**Cause:** Root Directory is not set to `frontend` in Vercel dashboard.

**Solution:**
1. Go to your project settings in Vercel
2. Find "Root Directory" setting
3. Set it to `frontend`
4. Redeploy

### Error: "Cannot find module"

**Cause:** Dependencies not installed correctly.

**Solution:**
1. Check that `frontend/package.json` exists
2. Ensure Root Directory is set to `frontend`
3. Check build logs for npm install errors

### Build Succeeds but App Doesn't Load

**Cause:** API URL not configured or CORS issues.

**Solution:**
1. Verify `REACT_APP_API_URL` environment variable is set
2. Check browser console for API errors
3. Verify backend CORS settings allow your Vercel domain

## Alternative: Build from Root (Not Recommended)

If you cannot set Root Directory in Vercel dashboard, you can modify `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build"
}
```

However, this approach is less reliable and **setting Root Directory is the recommended solution**.

## Verification

After deployment:
1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Check browser console for errors
3. Verify API calls are going to the correct backend URL
4. Test login functionality

## Next Steps

After successful frontend deployment:
1. Update backend CORS settings with your Vercel URL
2. Redeploy backend if needed
3. Test end-to-end functionality

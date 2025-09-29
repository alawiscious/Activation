# 🚀 Vercel Deployment Guide

## Quick Setup

### 1. **Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository: `alawiscious/Activation`
5. Vercel will auto-detect it's a Vite React app

### 2. **Environment Variables**
Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_AUTH_USERNAME=admin
VITE_AUTH_PASSWORD=activation2024
VITE_DATA_SOURCE=github
VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/alawiscious/Activation/main/master-revenue.csv
VITE_GENOME_STORAGE_TYPE=github
VITE_GENOME_FALLBACK_LOCAL=true
```

### 3. **Build Settings**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Your app will be live at: `https://activation-xxx.vercel.app`

## 🎯 What This Tests

✅ **Complete GitHub-only setup**
✅ **No local files required**
✅ **Environment variables from Vercel**
✅ **Data loading from GitHub raw URLs**
✅ **Authentication system**
✅ **All features working remotely**

## 🔧 Alternative: Netlify

If you prefer Netlify:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables in Site Settings → Environment Variables

## 🎉 Expected Result

Your Activation app will be fully functional with:
- ✅ All 717 companies loaded from GitHub
- ✅ Authentication working
- ✅ All features accessible
- ✅ No local dependencies

## 🚨 Troubleshooting

If data doesn't load:
1. Check environment variables are set correctly
2. Verify GitHub raw URLs are accessible
3. Check browser console for errors
4. Ensure repository is public

## 📱 Test URLs

After deployment, test these features:
- `/` - Main dashboard (should show 717 companies)
- `/analytics` - Analytics page
- `/contacts` - Contacts with Genome import
- `/company` - Company search and analysis

# 🚀 Netlify Deployment Guide

## Deploy to Netlify Production

### 1. **Build the Project**
```bash
npm run build
```

### 2. **Deploy to Netlify**

**Option A: Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

**Option B: Netlify Dashboard**
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### 3. **Set Environment Variables in Netlify**

In your Netlify dashboard, go to Site Settings > Environment Variables and add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PUBLIC_SITE_ORIGIN=https://your-app-name.netlify.app
```

### 4. **Test the OG Function**

After deployment, test:
```
https://your-app-name.netlify.app/.netlify/functions/share-og?id=6057bb84-b063-4c27-a525-44c50cc18c8b
```

### 5. **Test Sharing**

Once deployed:
- ✅ OG function will work
- ✅ Thumbnails will appear in share previews
- ✅ Social media platforms will show proper previews

## Why It Will Work on Netlify

- ✅ **Public URL**: Social platforms can access your deployed site
- ✅ **OG Function**: Properly deployed and accessible
- ✅ **Meta Tags**: Social platforms can fetch thumbnails
- ✅ **Environment Variables**: Properly configured for production

## Current Status

- ❌ **Localhost**: OG function not accessible to social platforms
- ✅ **Production**: Will work perfectly with thumbnails

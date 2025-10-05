# 📸 Image Storage Setup Guide

## Option 1: DigitalOcean Spaces (Recommended - $5/month)

### Step 1: Create a Space

1. Go to DigitalOcean Dashboard
2. Click **Create** → **Spaces**
3. Configure:
   - **Datacenter**: Bangalore (BLR1) - closest to India
   - **Enable CDN**: Yes (free, makes images fast globally)
   - **Name**: `edensnews` (or your choice)
   - **File Listing**: Restricted (recommended)
4. Click **Create Space**

### Step 2: Generate API Keys

1. In your Space, click **Settings**
2. Scroll to **Spaces access keys**
3. Click **Generate New Key**
4. Save these securely:
   - **Access Key**: (like AWS_ACCESS_KEY_ID)
   - **Secret Key**: (like AWS_SECRET_ACCESS_KEY)

### Step 3: Add to Your .env File

```env
# DigitalOcean Spaces Configuration
VITE_SPACES_ENDPOINT=blr1.digitaloceanspaces.com
VITE_SPACES_KEY=your_access_key_here
VITE_SPACES_SECRET=your_secret_key_here
VITE_SPACES_BUCKET=edensnews
VITE_SPACES_CDN_URL=https://edensnews.blr1.cdn.digitaloceanspaces.com
```

### Step 4: Install Dependencies

```bash
npm install aws-sdk
```

### Step 5: Use in Your Code

```javascript
import { uploadImage, deleteImage } from '@/utils/imageUpload';

// Upload image
const handleImageUpload = async (file) => {
  try {
    const imageUrl = await uploadImage(file, 'articles');
    console.log('Image uploaded:', imageUrl);
    // Save imageUrl to database
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Delete image
const handleImageDelete = async (imageUrl) => {
  await deleteImage(imageUrl);
};
```

### Cost: $5/month
- 250GB storage
- 1TB bandwidth
- CDN included
- Perfect for news site with thousands of images

---

## Option 2: Cloudflare R2 (Best Value - Pay as you go)

### Pricing
- **Storage**: $0.015/GB/month (~$1.50 for 100GB)
- **Bandwidth**: $0 (FREE - no egress charges!)
- **Operations**: Very cheap

### Setup

1. Go to Cloudflare Dashboard
2. Click **R2** → **Create Bucket**
3. Name: `edensnews-images`
4. Generate R2 API Token
5. Add to .env:

```env
VITE_R2_ACCOUNT_ID=your_account_id
VITE_R2_ACCESS_KEY=your_access_key
VITE_R2_SECRET_KEY=your_secret_key
VITE_R2_BUCKET=edensnews-images
VITE_R2_PUBLIC_URL=https://images.yourdomain.com
```

### Cost: ~$2-3/month for typical news site

---

## Option 3: Store on VPS (Free but not recommended)

### Setup

```bash
# On your droplet
mkdir -p /var/www/edensnews-images
chown -R www-data:www-data /var/www/edensnews-images
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name images.yourdomain.com;

    location / {
        root /var/www/edensnews-images;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Pros:
- ✅ Free (included in $6 droplet)
- ✅ Simple

### Cons:
- ❌ No CDN (slow for global users)
- ❌ Uses droplet storage (limited to 25GB)
- ❌ Manual backups needed
- ❌ No automatic optimization

---

## Option 4: Cloudinary (Free Tier)

### Pricing
- **Free**: 25GB storage, 25GB bandwidth/month
- **Paid**: Starts at $89/month

### Setup

1. Sign up at cloudinary.com
2. Get your credentials:
   - Cloud name
   - API Key
   - API Secret

3. Add to .env:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

4. Install SDK:

```bash
npm install cloudinary
```

### Features:
- ✅ Automatic image optimization
- ✅ On-the-fly transformations
- ✅ CDN included
- ✅ Free tier is generous

---

## 🎯 Recommendation for Edens News

### **Use DigitalOcean Spaces ($5/month)**

**Why?**
1. Same provider as your database (simpler management)
2. CDN included (fast globally)
3. 250GB storage (enough for 10,000+ high-quality images)
4. 1TB bandwidth (more than enough)
5. S3-compatible (easy to migrate if needed)

### Total Monthly Cost:
```
Database VPS:     $6
Image Storage:    $5
                 ---
Total:           $11/month

vs Supabase Pro: $25/month
Savings:         $14/month ($168/year)
```

---

## 📊 Storage Estimates

### How many images can you store?

**With 250GB (DigitalOcean Spaces):**
- High quality (2MB each): ~125,000 images
- Medium quality (500KB each): ~500,000 images
- Optimized (200KB each): ~1,250,000 images

**Typical news article:**
- 1 main image
- 2-3 additional images
- = 4 images per article

**250GB = ~30,000 articles** (more than enough!)

---

## 🚀 Migration from Supabase Storage

If you're currently using Supabase Storage:

### Step 1: Export Images

```javascript
// Script to download all images from Supabase
import { supabase } from './supabaseClient';
import fs from 'fs';
import https from 'https';

async function downloadImages() {
  const { data: files } = await supabase.storage
    .from('images')
    .list();

  for (const file of files) {
    const { data } = await supabase.storage
      .from('images')
      .download(file.name);
    
    // Save locally
    fs.writeFileSync(`./images/${file.name}`, data);
  }
}
```

### Step 2: Upload to DigitalOcean Spaces

```javascript
import { uploadImage } from './utils/imageUpload';
import fs from 'fs';

async function migrateImages() {
  const files = fs.readdirSync('./images');
  
  for (const filename of files) {
    const file = fs.readFileSync(`./images/${filename}`);
    const blob = new Blob([file]);
    const imageFile = new File([blob], filename);
    
    const newUrl = await uploadImage(imageFile, 'articles');
    console.log(`Migrated: ${filename} → ${newUrl}`);
    
    // Update database with new URL
    // await updateArticleImageUrl(oldUrl, newUrl);
  }
}
```

---

## ✅ Setup Checklist

- [ ] Choose storage provider (DigitalOcean Spaces recommended)
- [ ] Create Space/Bucket
- [ ] Generate API keys
- [ ] Add credentials to .env
- [ ] Install aws-sdk package
- [ ] Test image upload
- [ ] Update AdminWrite component to use new upload
- [ ] Migrate existing images (if any)
- [ ] Update image URLs in database
- [ ] Test image loading on website

---

## 🔧 Integration with AdminWrite

Update your article creation form:

```javascript
import { uploadOptimizedImage } from '@/utils/imageUpload';

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  try {
    // Upload with automatic optimization
    const imageUrl = await uploadOptimizedImage(file, 'articles', 1920);
    
    // Update form state
    setArticle(prev => ({ ...prev, image_url: imageUrl }));
    
    toast({ title: 'Image uploaded successfully!' });
  } catch (error) {
    toast({ 
      title: 'Upload failed', 
      description: error.message,
      variant: 'destructive' 
    });
  } finally {
    setUploading(false);
  }
};
```

---

**Ready to proceed?** Let me know which option you prefer and I'll help you set it up! 🚀

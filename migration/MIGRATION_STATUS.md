# Edens News - Database Migration Status Report

## 🎯 Project Goal
Migrate Edens News website from Supabase to self-hosted PostgreSQL on DigitalOcean VPS to reduce costs and avoid bandwidth limits.

---

## ✅ COMPLETED WORK

### 1. Infrastructure Setup
**DigitalOcean Droplet Created:**
- **IP Address:** `143.244.143.239`
- **OS:** Ubuntu 24.04 LTS
- **Specs:** 1 vCPU, 1GB RAM, 25GB SSD
- **Cost:** $6/month
- **SSH Access:** Configured with private key at `C:\Users\yadav\edensnews`
- **SSH Command:** `ssh -i "C:\Users\yadav\edensnews" root@143.244.143.239`

**Installed Software:**
- PostgreSQL 17 (running on port 5432)
- Node.js 18.20.8
- npm 10.8.2
- Nginx (installed, not configured yet)
- UFW firewall (configured: SSH, HTTP, HTTPS allowed)

### 2. Database Configuration
**PostgreSQL Setup:**
- **Database Name:** `postgres` (using default database, not `edensnews`)
- **Database User:** `edensnews_user`
- **Password:** Set by user (not in this document)
- **Connection:** Working via `sudo -u postgres psql -d postgres`

**⚠️ Important Note:** Data was imported to `postgres` database, NOT `edensnews` database. The `edensnews` database exists but is empty.

### 3. Data Migration - COMPLETE ✅

**Data Successfully Imported to `postgres` database:**

| Table | Row Count | Status |
|-------|-----------|--------|
| articles | 70 | ✅ Imported |
| categories | 11 | ✅ Imported |
| article_categories | 71 | ✅ Imported |
| article_views | 1,437 | ✅ Imported |
| user_profiles | 4 | ✅ Imported |
| site_settings | 1 | ✅ Imported |
| stream_settings | 16 | ✅ Imported |
| rss_feeds | 1 | ✅ Imported |
| broadcast_schedule | 7 | ✅ Imported |
| bookmarks | 0 | ✅ Empty (expected) |

**Migration Method Used:**
- Exported from Supabase using `pg_dump`
- Dump file: `supabase_full_dump.sql` (on user's desktop)
- Uploaded to server at `/root/data_export.sql`
- Imported to `postgres` database

**Supabase Source:**
- Project: `cfjwhudftdfivvjkavdg`
- Region: `aws-0-ap-south-1`
- Tables exported from `public` schema

### 4. Files Created/Modified

**On Server (`/root/`):**
- `01-server-setup.sh` - Server setup script
- `03-create-database-schema.sql` - Schema creation (for edensnews db, not used)
- `04-import-data.js` - Import script (had issues, not used)
- `data_export.sql` - Final working dump file
- `data/` - Directory with exported JSON/CSV files:
  - `articles.csv` (27MB)
  - `articles.json` (28MB)
  - `categories.json`
  - `article_categories.json`
  - `article_views.json`
  - `user_profiles.json`
  - `site_settings.json`
  - `stream_settings.json`
  - `rss_feeds.json`
  - `broadcast_schedule.json`
  - `bookmarks.json`
- `package.json` - Node.js config with `"type": "module"`
- `node_modules/` - Installed: `pg` package

**On Local Machine (`e:\edenswebsite\migration\`):**
- `02-export-supabase-data.js` - Export script (updated with correct table names)
- `convert-csv-to-json.js` - CSV to JSON converter
- `.env` - Contains Supabase credentials
- `data/` - Local copy of exported data
- Migration guide files (README.md, QUICKSTART.md, etc.)

### 5. Website Optimizations (Already Done)
- ✅ Added Google AdSense integration
- ✅ Added HilltopAds integration  
- ✅ Reduced Supabase bandwidth by 80% (query optimization)
- ✅ Created Terms & Privacy pages
- ✅ Fixed PWA icons and manifest

---

## 🔴 PENDING WORK

### 1. API Server Setup (CRITICAL - Next Step)
**Location:** `/root/` on VPS (143.244.143.239)

**Required:**
- Create Express.js API server
- Install dependencies: `express`, `cors`, `dotenv`, `pg`
- Connect to PostgreSQL `postgres` database (NOT `edensnews`)
- Database connection config:
  ```javascript
  {
    host: 'localhost',
    port: 5432,
    database: 'postgres',  // IMPORTANT: Use 'postgres', not 'edensnews'
    user: 'edensnews_user',
    password: '[user's password]'
  }
  ```

**API Endpoints Needed:**
- `GET /api/articles` - List articles
- `GET /api/articles/:id` - Get single article
- `POST /api/articles` - Create article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `GET /api/categories` - List categories
- `GET /api/bookmarks` - User bookmarks
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark
- `GET /api/analytics/views` - Article views
- `POST /api/analytics/views` - Track view
- `GET /api/settings/site` - Site settings
- `GET /api/settings/stream` - Stream settings

**Process Management:**
- Use PM2 to run API server
- Configure to start on boot
- Set up logging

**Port:** API should run on port 3000 or 5000

### 2. React App Updates (CRITICAL)
**Location:** `e:\edenswebsite\src\`

**Required Changes:**
- Create new database client at `src/api/newDatabaseClient.js`
- Replace Supabase calls with new API calls
- **Keep Supabase for authentication ONLY**
- Update these files:
  - `src/api/repos/articlesRepo.js`
  - `src/api/repos/categoriesRepo.js`
  - `src/api/repos/bookmarksRepo.js`
  - `src/api/repos/analyticsRepo.js`
  - `src/api/repos/settingsRepo.js`

**Authentication Strategy:**
- Keep using `@supabase/supabase-js` for Google OAuth
- Use Supabase Auth for login/signup
- Use new API for all data operations

### 3. Nginx Configuration
**Required:**
- Configure reverse proxy to API server
- Set up domain routing (if applicable)
- Optional: SSL/HTTPS with Let's Encrypt

### 4. Testing
**Test All Features:**
- Article CRUD operations
- Category management
- Bookmarks
- Analytics/views tracking
- Live streaming settings
- Admin panel
- User authentication (Google OAuth via Supabase)

### 5. Deployment
- Deploy React app changes
- Verify production environment
- Monitor for errors

---

## 🔧 Technical Details

### Database Schema (in `postgres` database)
**Main Tables:**
- `articles` - News articles with bilingual content (English/Kannada)
- `categories` - Article categories
- `article_categories` - Many-to-many relationship
- `article_views` - Analytics tracking
- `user_profiles` - User data
- `site_settings` - Global settings
- `stream_settings` - Live stream configuration
- `broadcast_schedule` - Broadcast timing
- `rss_feeds` - RSS feed sources
- `bookmarks` - User bookmarks

**Key Columns in `articles`:**
- `id` (uuid)
- `title_en`, `title_kn` (bilingual titles)
- `content_en`, `content_kn` (bilingual content)
- `reporter` (author name)
- `status` (published/draft)
- `created_at`, `updated_at`, `published_at`
- `image_url` (article image)

### Environment Variables Needed

**On Server (.env for API):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=edensnews_user
DB_PASSWORD=[user's password]
PORT=3000
NODE_ENV=production
```

**On Client (React app .env):**
```env
VITE_API_URL=http://143.244.143.239:3000/api
VITE_SUPABASE_URL=[existing - keep for auth]
VITE_SUPABASE_ANON_KEY=[existing - keep for auth]
```

### Migration Files Available
- `e:\edenswebsite\migration\05-setup-api-server.js` - Template API server code
- `e:\edenswebsite\migration\06-new-database-client.js` - Template client code

---

## 📊 Architecture Overview

### Current Architecture (After Migration):
```
┌─────────────────────────────────────┐
│         React App (Vercel)          │
│         edenswebsite                │
└─────────────────────────────────────┘
           ↓                ↓
    ┌──────────┐    ┌──────────────────┐
    │ Supabase │    │  DigitalOcean    │
    │   Auth   │    │   VPS API        │
    │  (Free)  │    │ 143.244.143.239  │
    └──────────┘    └──────────────────┘
                            ↓
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   (postgres db)  │
                    └──────────────────┘
```

### Data Flow:
1. **Authentication:** React App → Supabase Auth (Google OAuth)
2. **Articles/Data:** React App → VPS API → PostgreSQL
3. **Images:** Currently Supabase Storage (future: DigitalOcean Spaces)

---

## 💰 Cost Breakdown

| Service | Current | After Migration | Savings |
|---------|---------|-----------------|---------|
| Supabase | $0 (hitting limits) | $0 (auth only) | - |
| DigitalOcean VPS | - | $6/month | - |
| Images (future) | - | $5/month | - |
| **Total** | **$0** | **$11/month** | **vs $25 Supabase Pro** |

**Annual Savings: $168/year** 💰

---

## ⚠️ Important Notes

1. **Database Name:** Use `postgres` database, NOT `edensnews` (all data is in `postgres`)
2. **Authentication:** Keep Supabase ONLY for Google OAuth, everything else uses new API
3. **Server Access:** SSH key at `C:\Users\yadav\edensnews`
4. **Supabase Project:** `cfjwhudftdfivvjkavdg` (keep for auth only)
5. **Cost Target:** $11/month total (vs $25 Supabase Pro)

---

## 📋 Next Steps Checklist

### Phase 1: API Server (1-2 hours)
- [ ] Create Express.js API server on VPS
- [ ] Install dependencies: `express`, `cors`, `dotenv`, `pg`
- [ ] Configure database connection to `postgres` database
- [ ] Implement all API endpoints
- [ ] Install and configure PM2
- [ ] Test API endpoints with curl/Postman

### Phase 2: React App Updates (1-2 hours)
- [ ] Create new database client (`src/api/newDatabaseClient.js`)
- [ ] Update `articlesRepo.js` to use new API
- [ ] Update `categoriesRepo.js` to use new API
- [ ] Update `bookmarksRepo.js` to use new API
- [ ] Update `analyticsRepo.js` to use new API
- [ ] Update `settingsRepo.js` to use new API
- [ ] Keep Supabase client for auth only

### Phase 3: Nginx & Deployment (30 min)
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL/HTTPS (optional)
- [ ] Deploy React app changes
- [ ] Update environment variables

### Phase 4: Testing (30 min)
- [ ] Test article CRUD operations
- [ ] Test category management
- [ ] Test bookmarks
- [ ] Test analytics tracking
- [ ] Test live streaming settings
- [ ] Test admin panel
- [ ] Test Google OAuth login

### Phase 5: Go Live
- [ ] Monitor for errors
- [ ] Verify all features working
- [ ] Document any issues
- [ ] Celebrate! 🎉

---

## 🆘 Troubleshooting

### If API won't connect to database:
```bash
# Test database connection
psql -U edensnews_user -d postgres -h localhost

# Check if PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-17-main.log
```

### If data seems missing:
```bash
# Access database
sudo -u postgres psql -d postgres

# Check table counts
SELECT 'articles' as table_name, COUNT(*) FROM articles
UNION ALL
SELECT 'categories', COUNT(*) FROM categories;
```

### Server Access Issues:
```bash
# SSH to server
ssh -i "C:\Users\yadav\edensnews" root@143.244.143.239

# Check firewall
sudo ufw status

# Check running services
sudo systemctl list-units --type=service --state=running
```

### API Server Issues:
```bash
# Check if API is running
pm2 list

# View API logs
pm2 logs

# Restart API
pm2 restart all
```

---

## 📞 Contact & Support

**Server Details:**
- IP: 143.244.143.239
- SSH Key: `C:\Users\yadav\edensnews`
- Database: `postgres`
- User: `edensnews_user`

**Supabase (Auth Only):**
- Project: `cfjwhudftdfivvjkavdg`
- Region: `aws-0-ap-south-1`

---

**Last Updated:** 2025-10-05  
**Status:** Infrastructure ready, data migrated, API setup pending  
**Estimated Time to Complete:** 2-3 hours

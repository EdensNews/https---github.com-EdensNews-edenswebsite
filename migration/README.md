# Edens News - Migration to Self-Hosted PostgreSQL

Complete guide to migrate from Supabase to DigitalOcean VPS with PostgreSQL.

## 📋 Prerequisites

- DigitalOcean account
- SSH client (Windows Terminal or PuTTY)
- Node.js installed locally
- Your Supabase credentials

## 🚀 Step-by-Step Migration Guide

### Phase 1: Setup DigitalOcean VPS (30 minutes)

#### 1.1 Create Droplet

1. Go to https://www.digitalocean.com/
2. Click "Create" → "Droplets"
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic Shared CPU - $6/month (1GB RAM, 25GB SSD)
   - **Datacenter**: Bangalore (closest to India)
   - **Authentication**: SSH Key
   - **Hostname**: `edensnews-db`

#### 1.2 Create SSH Key (Windows)

```powershell
# Open PowerShell and run:
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Press Enter for default location
# Set a passphrase (optional but recommended)

# Copy your public key:
type C:\Users\YourName\.ssh\id_rsa.pub
```

Paste the public key content in DigitalOcean's SSH Key section.

#### 1.3 Connect to Your Droplet

```powershell
# Get your droplet IP from DigitalOcean dashboard
ssh root@YOUR_DROPLET_IP
```

#### 1.4 Run Server Setup Script

```bash
# Upload the setup script
# (From your local machine)
scp migration/01-server-setup.sh root@YOUR_DROPLET_IP:/root/

# On the droplet, run:
chmod +x 01-server-setup.sh
./01-server-setup.sh
```

**IMPORTANT**: After setup, change the database password:

```bash
sudo -u postgres psql
ALTER USER edensnews_user WITH PASSWORD 'your_strong_password_here';
\q
```

### Phase 2: Export Data from Supabase (20 minutes)

#### 2.1 Install Dependencies

```bash
# On your local machine
cd e:\edenswebsite
npm install pg
```

#### 2.2 Run Export Script

```bash
# Make sure your .env file has Supabase credentials
node migration/02-export-supabase-data.js
```

This will create `migration/data/` folder with all your data in JSON format.

### Phase 3: Create Database Schema (10 minutes)

#### 3.1 Upload Schema File

```powershell
# From your local machine
scp migration/03-create-database-schema.sql root@YOUR_DROPLET_IP:/root/
```

#### 3.2 Run Schema Creation

```bash
# On your droplet
psql -U edensnews_user -d edensnews -h localhost < 03-create-database-schema.sql
```

Enter your database password when prompted.

### Phase 4: Import Data (30 minutes)

#### 4.1 Upload Data and Import Script

```powershell
# From your local machine
scp -r migration/data root@YOUR_DROPLET_IP:/root/
scp migration/04-import-data.js root@YOUR_DROPLET_IP:/root/
```

#### 4.2 Install Node.js Dependencies on VPS

```bash
# On your droplet
cd /root
npm init -y
npm install pg
```

#### 4.3 Update Database Password in Import Script

```bash
# Edit the import script
nano 04-import-data.js

# Change this line:
password: 'CHANGE_THIS_PASSWORD', // Use your actual password

# Save: Ctrl+X, Y, Enter
```

#### 4.4 Run Import

```bash
node 04-import-data.js
```

### Phase 5: Setup API Server (20 minutes)

#### 5.1 Create API Directory

```bash
# On your droplet
mkdir -p /var/www/edensnews-api
cd /var/www/edensnews-api
```

#### 5.2 Upload API Server

```powershell
# From your local machine
scp migration/05-setup-api-server.js root@YOUR_DROPLET_IP:/var/www/edensnews-api/server.js
```

#### 5.3 Create Package.json

```bash
# On your droplet
cd /var/www/edensnews-api
cat > package.json << 'EOF'
{
  "name": "edensnews-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
}
EOF

npm install
```

#### 5.4 Create Environment File

```bash
cat > .env << 'EOF'
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edensnews
DB_USER=edensnews_user
DB_PASSWORD=your_password_here
EOF

# Edit and add your actual password
nano .env
```

#### 5.5 Setup PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start API server
pm2 start server.js --name edensnews-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# Check status
pm2 status
```

#### 5.6 Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
cat > /etc/nginx/sites-available/edensnews-api << 'EOF'
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/edensnews-api /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Phase 6: Update Your React App (30 minutes)

#### 6.1 Create New Environment Variables

Add to your `.env` file:

```env
VITE_API_URL=http://YOUR_DROPLET_IP/api
```

#### 6.2 Update Database Client

```bash
# Copy the new client file
cp migration/06-new-database-client.js src/api/databaseClient.js
```

#### 6.3 Update Your Repositories

You need to update these files to use the new client:

**src/api/repos/articlesRepo.js:**

```javascript
import { db } from '@/api/databaseClient';

export const articlesRepo = {
  async list({ limit = 20, offset = 0, status = 'published' } = {}) {
    return await db.getArticles({ limit, offset, status });
  },
  
  async get(id) {
    return await db.getArticle(id);
  },
  
  async create(article) {
    return await db.createArticle(article);
  },
  
  async update(id, updates) {
    return await db.updateArticle(id, updates);
  },
  
  async delete(id) {
    return await db.deleteArticle(id);
  },
  
  async search(query, options = {}) {
    return await db.searchArticles(query, options.limit);
  }
};
```

### Phase 7: Testing (15 minutes)

#### 7.1 Test API Server

```bash
# On your droplet
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}

# Test articles endpoint
curl http://localhost:3001/api/articles?limit=5
```

#### 7.2 Test from Your Local App

```bash
# On your local machine
npm run dev

# Open browser and check console for errors
# Try loading articles, creating, updating, deleting
```

### Phase 8: Setup SSL (Optional but Recommended)

#### 8.1 Point Domain to Droplet

In your domain registrar (e.g., GoDaddy, Namecheap):
- Create an A record pointing `api.edensnews.com` to your droplet IP

#### 8.2 Install SSL Certificate

```bash
# On your droplet
# Update Nginx config with your domain
nano /etc/nginx/sites-available/edensnews-api
# Change server_name to: api.edensnews.com

# Get SSL certificate
certbot --nginx -d api.edensnews.com

# Follow prompts, choose redirect HTTP to HTTPS
```

#### 8.3 Update Environment Variable

```env
VITE_API_URL=https://api.edensnews.com/api
```

## 🔧 Maintenance

### Daily Backups

```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U edensnews_user -d edensnews > $BACKUP_DIR/edensnews_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "edensnews_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /root/backup-db.sh
```

### Monitor Server

```bash
# Check API server status
pm2 status

# View API logs
pm2 logs edensnews-api

# Check database connections
psql -U edensnews_user -d edensnews -c "SELECT count(*) FROM articles;"

# Check disk space
df -h

# Check memory
free -h
```

## 📊 Cost Breakdown

| Item | Monthly Cost |
|------|-------------|
| DigitalOcean Droplet (1GB) | $6 |
| Bandwidth (1TB included) | $0 |
| Backups (optional) | $1.20 |
| **Total** | **$7.20/month** |

vs Supabase Pro: $25/month

**Savings: $17.80/month ($213.60/year)**

## 🆘 Troubleshooting

### Can't connect to database
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check firewall
ufw status

# Test connection
psql -U edensnews_user -d edensnews -h localhost
```

### API server not responding
```bash
# Check PM2 status
pm2 status

# Restart API
pm2 restart edensnews-api

# Check logs
pm2 logs edensnews-api --lines 100
```

### High memory usage
```bash
# Check processes
htop

# Restart PostgreSQL
systemctl restart postgresql

# Restart API
pm2 restart edensnews-api
```

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs edensnews-api`
2. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-15-main.log`
3. Test API directly: `curl http://localhost:3001/health`

## ✅ Checklist

- [ ] DigitalOcean droplet created
- [ ] SSH key configured
- [ ] Server setup script run
- [ ] Database password changed
- [ ] Data exported from Supabase
- [ ] Database schema created
- [ ] Data imported to PostgreSQL
- [ ] API server running
- [ ] PM2 configured
- [ ] Nginx configured
- [ ] React app updated
- [ ] Testing completed
- [ ] SSL certificate installed (optional)
- [ ] Daily backups configured
- [ ] Monitoring setup

## 🎉 Success!

Your Edens News is now running on your own infrastructure!

**Benefits:**
- ✅ No bandwidth limits
- ✅ Predictable costs
- ✅ Full control
- ✅ Better performance
- ✅ No vendor lock-in

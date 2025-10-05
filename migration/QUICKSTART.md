# 🚀 Quick Start - 30 Minute Migration

This is a condensed version for experienced users. For detailed instructions, see README.md.

## Prerequisites
- [ ] DigitalOcean account with $6/month credit
- [ ] SSH access configured
- [ ] Node.js installed locally

## Steps

### 1. Create DigitalOcean Droplet (5 min)
```
Image: Ubuntu 22.04 LTS
Size: $6/month (1GB RAM)
Region: Bangalore
SSH Key: Add your public key
```

### 2. Setup Server (10 min)
```bash
# Connect
ssh root@YOUR_DROPLET_IP

# Upload and run setup
scp migration/01-server-setup.sh root@YOUR_DROPLET_IP:/root/
ssh root@YOUR_DROPLET_IP
chmod +x 01-server-setup.sh
./01-server-setup.sh

# Change password
sudo -u postgres psql
ALTER USER edensnews_user WITH PASSWORD 'your_strong_password';
\q
```

### 3. Export & Import Data (10 min)
```bash
# Local: Export from Supabase
node migration/02-export-supabase-data.js

# Upload to VPS
scp migration/03-create-database-schema.sql root@YOUR_DROPLET_IP:/root/
scp -r migration/data root@YOUR_DROPLET_IP:/root/
scp migration/04-import-data.js root@YOUR_DROPLET_IP:/root/

# On VPS: Create schema
psql -U edensnews_user -d edensnews -h localhost < 03-create-database-schema.sql

# On VPS: Import data
cd /root
npm init -y
npm install pg
nano 04-import-data.js  # Update password
node 04-import-data.js
```

### 4. Setup API Server (10 min)
```bash
# Upload API
scp migration/05-setup-api-server.js root@YOUR_DROPLET_IP:/var/www/edensnews-api/server.js

# On VPS: Setup
cd /var/www/edensnews-api
npm init -y
npm install express cors pg dotenv

# Create .env
echo "PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edensnews
DB_USER=edensnews_user
DB_PASSWORD=your_password" > .env

# Start with PM2
npm install -g pm2
pm2 start server.js --name edensnews-api
pm2 save
pm2 startup

# Configure Nginx
nano /etc/nginx/sites-available/edensnews-api
# Add proxy config (see README.md)
ln -s /etc/nginx/sites-available/edensnews-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 5. Update React App (5 min)
```bash
# Add to .env
echo "VITE_API_URL=http://YOUR_DROPLET_IP/api" >> .env

# Copy new client
cp migration/06-new-database-client.js src/api/databaseClient.js

# Update repos to use new client (see README.md)
```

### 6. Test
```bash
# Test API
curl http://YOUR_DROPLET_IP/api/articles?limit=5

# Test React app
npm run dev
```

## Done! 🎉

Your app is now running on your own infrastructure for $6/month!

## Next Steps
- [ ] Setup SSL with Let's Encrypt
- [ ] Configure daily backups
- [ ] Setup monitoring
- [ ] Update production deployment

## Rollback Plan
If something goes wrong, just change `.env` back to Supabase:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

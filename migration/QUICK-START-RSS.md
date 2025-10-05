# Quick Start: RSS Automation

## 1. Upload to VPS
```bash
scp migration/rss-automation.js root@143.244.143.239:/root/edensnews/
scp migration/server.env root@143.244.143.239:/root/edensnews/
```

## 2. SSH and Install
```bash
ssh root@143.244.143.239
cd /root/edensnews
npm install node-fetch@2 xml2js dotenv
```

## 3. Test Run
```bash
node rss-automation.js
```

## 4. Setup Cron (runs every hour)
```bash
crontab -e
# Add this line:
0 * * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1
```

## 5. Check Logs
```bash
tail -f /var/log/rss-automation.log
```

## 6. Verify
- Check website home page for new articles
- Run: `SELECT count(*) FROM articles WHERE status = 'published';`

Done! RSS automation will now run automatically every hour.

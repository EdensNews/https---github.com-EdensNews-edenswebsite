# RSS Automation Setup Guide

This guide will help you set up automatic RSS feed processing on your VPS.

## Prerequisites

- VPS access (root@143.244.143.239)
- RSS feeds configured in database
- API server running

## Step 1: Upload Files to VPS

Upload these files to your VPS:
```bash
# From your local machine
scp e:\edenswebsite\migration\rss-automation.js root@143.244.143.239:/root/edensnews/
scp e:\edenswebsite\migration\server.env root@143.244.143.239:/root/edensnews/
```

## Step 2: Install Dependencies on VPS

SSH into your VPS and install required packages:

```bash
ssh root@143.244.143.239

cd /root/edensnews

# Install required npm packages
npm install node-fetch@2 xml2js dotenv
```

## Step 3: Test the Automation Script

Run it manually first to ensure it works:

```bash
cd /root/edensnews
node rss-automation.js
```

You should see output like:
```
=== RSS Automation Started ===
Time: 2025-10-05T...

Found 3 active RSS feeds

--- Processing feed: Example Feed ---
Fetched 10 articles from RSS
Processing: Article Title...
✓ Published: Article Title... (ID: 123)
...

=== RSS Automation Completed ===
Total articles processed: 10
New articles published: 5
Duplicates skipped: 5
```

## Step 4: Set Up Cron Job

Create a cron job to run the automation every hour:

```bash
# Open crontab editor
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1

# Save and exit (Ctrl+X, then Y, then Enter)
```

### Cron Schedule Options:

```bash
# Every hour
0 * * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1

# Every 30 minutes
*/30 * * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1

# Every 2 hours
0 */2 * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1

# Every day at 6 AM
0 6 * * * cd /root/edensnews && node rss-automation.js >> /var/log/rss-automation.log 2>&1
```

## Step 5: Verify Cron Job

Check if cron job is set up:
```bash
crontab -l
```

## Step 6: Monitor Logs

View automation logs:
```bash
# View latest logs
tail -f /var/log/rss-automation.log

# View last 50 lines
tail -50 /var/log/rss-automation.log

# Search for errors
grep -i error /var/log/rss-automation.log
```

## Step 7: Configure RSS Feeds in Database

Make sure your RSS feeds have categories assigned:

```sql
-- Connect to database
psql -U edensnews_user -d postgres

-- Check existing feeds
SELECT id, name, url, default_category_id, is_active FROM rss_feeds;

-- Update feed to assign default category (example: crime = category ID 2)
UPDATE rss_feeds SET default_category_id = 2 WHERE id = 1;

-- Make sure feed is active
UPDATE rss_feeds SET is_active = true WHERE id = 1;
```

## Troubleshooting

### Issue: Articles not appearing on home page

**Check:**
1. Articles are published: `SELECT count(*) FROM articles WHERE status = 'published';`
2. Articles have categories: `SELECT count(*) FROM article_categories;`
3. Clear cache and refresh website

### Issue: Cron job not running

**Check:**
1. Cron service is running: `systemctl status cron`
2. Check cron logs: `grep CRON /var/log/syslog`
3. Verify file paths in crontab

### Issue: Translation failing

**Check:**
1. VITE_GEMINI_API_KEY is set in server.env
2. Check logs for API errors
3. Verify API key is valid

### Issue: Duplicate articles

**Check:**
1. `rss_processed_articles` table exists
2. Run: `SELECT count(*) FROM rss_processed_articles;`

## Manual Run Commands

```bash
# Run automation manually
cd /root/edensnews && node rss-automation.js

# Run with verbose output
cd /root/edensnews && node rss-automation.js 2>&1 | tee -a manual-run.log

# Test with specific feed (modify script to process only one feed)
```

## Stop Automation

```bash
# Remove cron job
crontab -e
# Delete the line with rss-automation.js

# Or disable all feeds in database
UPDATE rss_feeds SET is_active = false;
```

## Performance Tips

1. **Limit articles per run**: Modify script to process max 10 articles per feed
2. **Increase delay**: Change `setTimeout(resolve, 2000)` to higher value
3. **Run less frequently**: Change cron to every 2-4 hours
4. **Monitor database size**: Regularly check article count

## Success Indicators

✓ Cron job listed in `crontab -l`
✓ Log file exists and updates: `/var/log/rss-automation.log`
✓ New articles appear in database: `SELECT * FROM articles ORDER BY created_at DESC LIMIT 10;`
✓ Articles visible on website home page
✓ Articles have categories assigned

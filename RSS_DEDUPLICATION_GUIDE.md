# RSS Feed Deduplication System

This guide explains how the RSS feed deduplication system works to prevent repetitive news in your RSS feed translation project.

## Overview

The system prevents duplicate RSS articles from being processed multiple times by:
1. Tracking processed articles in a dedicated database table
2. Checking for existing articles before showing new ones
3. Displaying "No new news" message when all articles have been processed
4. Marking articles as processed when they are imported

## Database Changes

### New Tables

1. **rss_processed_articles** - Tracks all RSS articles that have been processed
   - Stores RSS feed ID, article identifiers, processing status
   - Prevents duplicate processing of the same article

### New Columns in Articles Table

- `rss_source_url` - Original RSS source URL
- `rss_article_id` - RSS article identifier
- `rss_guid` - RSS GUID
- `rss_link` - RSS article link
- `rss_pub_date` - RSS publication date
- `is_rss_import` - Boolean flag for RSS imports

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to add the necessary tables and columns:

```sql
-- Run this in your Supabase SQL editor
-- File: tools/rss-deduplication-migration.sql
```

### 2. Update Your Application

The following files have been updated:

- `src/api/repos/rssRepo.js` - Added deduplication methods
- `netlify/functions/fetch-rss.js` - Enhanced RSS parsing with content hashing
- `src/pages/AdminRss.jsx` - Shows only new articles, handles no-news scenario
- `src/pages/AdminWrite.jsx` - Marks articles as processed when imported

## How It Works

### 1. RSS Feed Fetching

When you fetch articles from an RSS feed:

1. **Fetch RSS Data**: The system fetches all articles from the RSS feed
2. **Check for Duplicates**: Each article is checked against the `rss_processed_articles` table
3. **Filter New Articles**: Only new (unprocessed) articles are shown
4. **Display Results**: 
   - If new articles exist: Shows them for import
   - If no new articles: Shows "No new articles" message

### 2. Article Import Process

When you import an RSS article:

1. **Create Article**: The article is saved to the `articles` table with RSS tracking fields
2. **Mark as Processed**: The article is marked as processed in `rss_processed_articles`
3. **Prevent Future Duplicates**: Future fetches will skip this article

### 3. Deduplication Logic

The system uses multiple identifiers to prevent duplicates:

- **RSS Article ID**: Primary identifier from RSS feed
- **RSS GUID**: Alternative identifier from RSS feed
- **RSS Link**: Article URL as fallback identifier
- **Content Hash**: SHA-256 hash of title + description for content-based deduplication

## User Experience

### For RSS Feed Management

1. **Select RSS Feed**: Choose a feed from the list
2. **Fetch Articles**: Click to fetch articles from the feed
3. **View Results**:
   - **New Articles Found**: Shows count of new vs total articles
   - **No New Articles**: Shows "All articles have been processed" message
4. **Import Articles**: Only new articles are available for import

### For Article Import

1. **Import Article**: Click "Import" on any new article
2. **Edit and Translate**: Make necessary edits and translations
3. **Save Article**: Article is saved and automatically marked as processed
4. **Prevent Duplicates**: Article won't appear in future RSS fetches

## Benefits

1. **No Repetitive News**: Prevents the same article from being imported multiple times
2. **Clear Status**: Shows exactly how many new articles are available
3. **Efficient Workflow**: Only shows articles that need attention
4. **Data Integrity**: Maintains clean, non-duplicate article database
5. **User-Friendly**: Clear messaging when no new news is available

## Technical Details

### Database Functions

- `is_rss_article_processed()` - Checks if an article has been processed
- `get_new_rss_articles()` - Returns only new articles for a feed
- `generate_content_hash()` - Creates content hash for deduplication

### API Methods

- `rssRepo.checkArticleProcessed()` - Check if article exists
- `rssRepo.getNewArticles()` - Get new articles for a feed
- `rssRepo.markArticleAsProcessed()` - Mark article as processed
- `rssRepo.getProcessedArticles()` - Get processed articles history

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure you have proper permissions in Supabase
2. **Duplicate Articles Still Appearing**: Check that the migration script ran completely
3. **Performance Issues**: The system uses database indexes for optimal performance

### Verification

To verify the system is working:

1. Import an RSS article
2. Fetch the same RSS feed again
3. The imported article should not appear in the new articles list
4. You should see "No new articles" message if all articles are processed

## Future Enhancements

Potential improvements for the system:

1. **Bulk Processing**: Process multiple articles at once
2. **RSS Feed Scheduling**: Automatic RSS fetching at intervals
3. **Content Similarity**: Detect similar articles even with different titles
4. **Analytics**: Track RSS feed performance and article processing statistics

## Support

If you encounter issues with the RSS deduplication system:

1. Check that all database migrations have been applied
2. Verify that the RSS feed URLs are accessible
3. Check the browser console for any JavaScript errors
4. Ensure proper database permissions are set up

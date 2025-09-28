# Database Setup Instructions

This directory contains scripts to set up the required database tables for the Eden's Website application.

## Prerequisites

1. A Supabase project
2. Supabase URL and Service Role Key

## Setup Instructions

1. Copy the contents of `setup-database.sql` 
2. Go to your Supabase project dashboard
3. Navigate to the SQL Editor
4. Paste the SQL script and run it

This will create all the necessary tables and set up the required relationships and policies.

## Tables Created

- `categories` - News categories (Politics, Sports, etc.)
- `rss_feeds` - RSS feed sources
- `article_categories` - Junction table linking articles to categories
- `media_items` - Uploaded media files
- `stream_settings` - Live stream configuration
- `bookmarks` - User bookmarked articles

## Sample Data

The script also inserts sample categories to get you started:
- Politics
- Sports
- Technology
- Entertainment
- World

## RLS Policies

The script sets up Row Level Security policies for:
- Public read access to categories, RSS feeds, and stream settings
- Authenticated users can manage their own bookmarks
- Admin users can manage categories and RSS feeds
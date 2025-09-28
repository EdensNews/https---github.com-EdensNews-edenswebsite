# Fixing RSS Feed and Category Issues

This guide will help you resolve the issues with RSS feeds and categories in your Eden's Website application.

## Problem Summary

The RSS feed and category functionality isn't working because the required database tables have a different structure than expected. Based on our analysis, the tables exist but with a simplified structure.

## Solution Steps

### Step 1: Update Database Tables

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the following SQL script from `tools/update-categories-table.sql`:

```sql
-- Script to update the categories table structure
-- Run this script in your Supabase SQL editor

-- Add missing columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_kn TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_kn TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create updated_at trigger for categories table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for categories table
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Update existing rows to populate new columns
UPDATE public.categories 
SET 
  name_en = name,
  name_kn = name,
  is_active = true,
  sort_order = 0
WHERE name_en IS NULL;

-- Insert sample categories with full structure
INSERT INTO public.categories (name, name_en, name_kn, slug, description_en, description_kn, is_active, sort_order) VALUES
  ('Politics', 'Politics', 'ರಾಜಕೀಯ', 'politics', 'Political news and updates', 'ರಾಜಕೀಯ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 1),
  ('Sports', 'Sports', 'ಕ್ರೀಡೆ', 'sports', 'Sports news and updates', 'ಕ್ರೀಡಾ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 2),
  ('Technology', 'Technology', 'ತಂತ್ರಜ್ಞಾನ', 'technology', 'Technology news and updates', 'ತಂತ್ರಜ್ಞಾನ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 3),
  ('Entertainment', 'Entertainment', 'ಮನರಂಜನೆ', 'entertainment', 'Entertainment news and updates', 'ಮನರಂಜನಾ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 4),
  ('World', 'World', 'ಪ್ರಪಂಚ', 'world', 'World news and updates', 'ಪ್ರಪಂಚದ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 5)
ON CONFLICT (slug) DO NOTHING;
```

4. Click "Run" to execute the script

### Step 2: Verify the Fix

1. Restart your development server:
   ```
   npm run dev
   ```

2. Test the category functionality:
   - Go to Admin → Categories
   - Try adding a new category
   - Check if it appears in the dropdown when creating articles

3. Test the RSS feed functionality:
   - Go to Admin → RSS Feeds
   - Add a new RSS feed (e.g., https://feeds.bbci.co.uk/news/rss.xml)
   - Click on the feed to fetch articles
   - Try importing an article

### Step 3: Troubleshooting

If you still encounter issues:

1. Check the browser console for any error messages
2. Verify that your Supabase environment variables are correctly set in your `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Make sure your Supabase project has the required tables by checking the Table Editor

4. If you see "No categories found" message, it means the categories table is empty or not accessible

### Step 4: Additional Notes

1. The application now includes error handling in the repository files to provide better debugging information

2. The Home page now properly handles cases where no articles are found

3. The Header component uses fallback categories if the database is empty

4. The AdminWrite component now properly links articles to categories when saving

## Conclusion

After following these steps, your RSS feed and category functionality should be working correctly. The key was updating the existing database tables to match the expected structure in the application code.

If you continue to experience issues, please check the browser console for specific error messages and ensure your Supabase project is properly configured.
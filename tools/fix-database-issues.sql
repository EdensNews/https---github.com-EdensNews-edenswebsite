-- Comprehensive database fix script for Eden's Website
-- Run this script in your Supabase SQL editor to fix all issues

-- 1. Fix categories table structure
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

-- Update existing rows to populate new columns
UPDATE public.categories 
SET 
  name_en = COALESCE(name_en, name),
  name_kn = COALESCE(name_kn, name),
  is_active = COALESCE(is_active, true),
  sort_order = COALESCE(sort_order, 0)
WHERE name_en IS NULL OR name_kn IS NULL;

-- 2. Create article_views table for analytics
CREATE TABLE IF NOT EXISTS public.article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON public.article_views(viewed_at);

-- Enable RLS for article_views
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for article_views
CREATE POLICY "Allow anyone to insert view records" ON public.article_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anyone to read view counts" ON public.article_views
    FOR SELECT USING (true);

CREATE POLICY "Allow admins to read all view data" ON public.article_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- 3. Create updated_at function and trigger for categories
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

-- 4. Insert/Update sample categories with full structure
INSERT INTO public.categories (name, name_en, name_kn, slug, description_en, description_kn, is_active, sort_order) VALUES
  ('Politics', 'Politics', 'ರಾಜಕೀಯ', 'politics', 'Political news and updates', 'ರಾಜಕೀಯ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 1),
  ('Sports', 'Sports', 'ಕ್ರೀಡೆ', 'sports', 'Sports news and updates', 'ಕ್ರೀಡಾ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 2),
  ('Technology', 'Technology', 'ತಂತ್ರಜ್ಞಾನ', 'technology', 'Technology news and updates', 'ತಂತ್ರಜ್ಞಾನ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 3),
  ('Entertainment', 'Entertainment', 'ಮನರಂಜನೆ', 'entertainment', 'Entertainment news and updates', 'ಮನರಂಜನಾ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 4),
  ('World', 'World', 'ಪ್ರಪಂಚ', 'world', 'World news and updates', 'ಪ್ರಪಂಚದ ಸುದ್ದಿಗಳು ಮತ್ತು ನವೀಕರಣಗಳು', true, 5),
  ('RSS', 'RSS', 'RSS', 'rss', 'RSS feed articles', 'RSS ಫೀಡ್ ಲೇಖನಗಳು', true, 6)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_kn = EXCLUDED.name_kn,
  description_en = EXCLUDED.description_en,
  description_kn = EXCLUDED.description_kn,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 5. Ensure articles table has all required columns
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS title_kn TEXT,
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_kn TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT,
ADD COLUMN IF NOT EXISTS reporter TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS breaking_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON public.articles(is_breaking);

-- 7. Update RLS policies for categories to allow admin access
DROP POLICY IF EXISTS "categories_admin_policy" ON public.categories;
CREATE POLICY "categories_admin_policy" ON public.categories
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- 8. Ensure RSS feeds table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  url TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ
);

-- Enable RLS for rss_feeds
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

-- Create policies for rss_feeds
CREATE POLICY "rss_feeds_read_policy" ON public.rss_feeds
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "rss_feeds_admin_policy" ON public.rss_feeds
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- Create trigger for rss_feeds updated_at
DROP TRIGGER IF EXISTS set_rss_feeds_updated_at ON public.rss_feeds;
CREATE TRIGGER set_rss_feeds_updated_at
  BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 9. Ensure media_items table exists
CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'image'
);

-- Enable RLS for media_items
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Create policies for media_items
CREATE POLICY "media_items_read_policy" ON public.media_items
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "media_items_admin_policy" ON public.media_items
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- 10. Ensure article_categories junction table exists
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (article_id, category_id)
);

-- Enable RLS for article_categories
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for article_categories
CREATE POLICY "article_categories_read_policy" ON public.article_categories
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "article_categories_admin_policy" ON public.article_categories
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- Success message
SELECT 'Database setup completed successfully!' as message;

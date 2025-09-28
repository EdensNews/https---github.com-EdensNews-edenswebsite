-- Database setup script for Eden's Website
-- Run this script in your Supabase SQL editor

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create categories table (matching existing structure)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  slug TEXT UNIQUE
);

-- Create rss_feeds table
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source_name TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMPTZ
);

-- Create article_categories table (junction table)
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (article_id, category_id)
);

-- Create media_items table
CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT,
  file_url TEXT,
  file_type TEXT DEFAULT 'image'
);

-- Create stream_settings table
CREATE TABLE IF NOT EXISTS public.stream_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stream_url TEXT,
  is_live BOOLEAN DEFAULT false,
  subtitle TEXT
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE
);

-- Create updated_at function and triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tables that need updated_at
DROP TRIGGER IF EXISTS set_rss_feeds_updated_at ON public.rss_feeds;
CREATE TRIGGER set_rss_feeds_updated_at
  BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_stream_settings_updated_at ON public.stream_settings;
CREATE TRIGGER set_stream_settings_updated_at
  BEFORE UPDATE ON public.stream_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Add RLS policies for public read access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "categories_read_policy" ON "public"."categories"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "rss_feeds_read_policy" ON "public"."rss_feeds"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "article_categories_read_policy" ON "public"."article_categories"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "stream_settings_read_policy" ON "public"."stream_settings"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create policies for authenticated users to insert/update their own data
CREATE POLICY "bookmarks_policy" ON "public"."bookmarks"
AS PERMISSIVE FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policies for admins to manage categories and RSS feeds
CREATE POLICY "categories_admin_policy" ON "public"."categories"
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

CREATE POLICY "rss_feeds_admin_policy" ON "public"."rss_feeds"
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

-- Insert some sample categories (matching existing structure)
INSERT INTO public.categories (name, slug) VALUES
  ('Politics', 'politics'),
  ('Sports', 'sports'),
  ('Technology', 'technology'),
  ('Entertainment', 'entertainment'),
  ('World', 'world')
ON CONFLICT (slug) DO NOTHING;
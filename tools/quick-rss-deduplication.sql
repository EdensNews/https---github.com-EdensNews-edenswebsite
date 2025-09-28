-- Quick RSS Deduplication Fix
-- This is a minimal version that works with existing database structure

-- 1. Add basic RSS tracking columns to articles table
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS rss_source_url TEXT,
ADD COLUMN IF NOT EXISTS rss_article_id TEXT,
ADD COLUMN IF NOT EXISTS is_rss_import BOOLEAN DEFAULT false;

-- 2. Create a simple processed articles table
CREATE TABLE IF NOT EXISTS public.rss_processed_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rss_feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  rss_article_id TEXT NOT NULL,
  rss_link TEXT NOT NULL,
  rss_title TEXT NOT NULL,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  UNIQUE(rss_feed_id, rss_article_id)
);

-- 3. Create basic indexes
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_feed_id ON public.rss_processed_articles(rss_feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_processed ON public.rss_processed_articles(is_processed);

-- 4. Enable RLS
ALTER TABLE public.rss_processed_articles ENABLE ROW LEVEL SECURITY;

-- 5. Create basic RLS policies
CREATE POLICY "Allow authenticated users to manage processed articles" ON public.rss_processed_articles
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Create simple function to check if article is processed
CREATE OR REPLACE FUNCTION public.is_rss_article_processed(
    p_rss_feed_id UUID,
    p_rss_article_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    processed_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO processed_count
    FROM public.rss_processed_articles
    WHERE rss_feed_id = p_rss_feed_id
    AND rss_article_id = p_rss_article_id;
    
    RETURN processed_count > 0;
END;
$$ LANGUAGE plpgsql;

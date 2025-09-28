-- Clean RSS Deduplication Migration Script
-- This script safely adds RSS deduplication without conflicts

-- 1. Add unique identifier fields to articles table for RSS deduplication
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS rss_source_url TEXT,
ADD COLUMN IF NOT EXISTS rss_article_id TEXT,
ADD COLUMN IF NOT EXISTS rss_guid TEXT,
ADD COLUMN IF NOT EXISTS rss_link TEXT,
ADD COLUMN IF NOT EXISTS rss_pub_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_rss_import BOOLEAN DEFAULT false;

-- 2. Create RSS processed articles tracking table
CREATE TABLE IF NOT EXISTS public.rss_processed_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- RSS feed information
  rss_feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  rss_source_url TEXT NOT NULL,
  
  -- Article identification
  rss_article_id TEXT NOT NULL,
  rss_guid TEXT,
  rss_link TEXT NOT NULL,
  rss_title TEXT NOT NULL,
  rss_pub_date TIMESTAMPTZ,
  
  -- Processing status
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  
  -- Content hash for duplicate detection
  content_hash TEXT,
  
  -- Unique constraint to prevent duplicates
  UNIQUE(rss_feed_id, rss_article_id),
  UNIQUE(rss_feed_id, rss_guid),
  UNIQUE(rss_feed_id, rss_link)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_feed_id ON public.rss_processed_articles(rss_feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_processed ON public.rss_processed_articles(is_processed);
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_pub_date ON public.rss_processed_articles(rss_pub_date);
CREATE INDEX IF NOT EXISTS idx_rss_processed_articles_content_hash ON public.rss_processed_articles(content_hash);

-- 4. Create index on articles for RSS fields
CREATE INDEX IF NOT EXISTS idx_articles_rss_source_url ON public.articles(rss_source_url);
CREATE INDEX IF NOT EXISTS idx_articles_rss_article_id ON public.articles(rss_article_id);
CREATE INDEX IF NOT EXISTS idx_articles_rss_guid ON public.articles(rss_guid);
CREATE INDEX IF NOT EXISTS idx_articles_is_rss_import ON public.articles(is_rss_import);

-- 5. Enable RLS for rss_processed_articles table
ALTER TABLE public.rss_processed_articles ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read processed articles" ON public.rss_processed_articles;
DROP POLICY IF EXISTS "Allow authenticated users to insert processed articles" ON public.rss_processed_articles;
DROP POLICY IF EXISTS "Allow authenticated users to update processed articles" ON public.rss_processed_articles;
DROP POLICY IF EXISTS "Allow authenticated users to manage processed articles" ON public.rss_processed_articles;

-- 7. Create RLS policies for rss_processed_articles
CREATE POLICY "Allow authenticated users to read processed articles" ON public.rss_processed_articles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert processed articles" ON public.rss_processed_articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update processed articles" ON public.rss_processed_articles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. Create function to generate content hash
CREATE OR REPLACE FUNCTION public.generate_content_hash(title TEXT, content TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(COALESCE(title, '') || '|' || COALESCE(content, ''), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to check if RSS article is already processed
CREATE OR REPLACE FUNCTION public.is_rss_article_processed(
    p_rss_feed_id UUID,
    p_rss_article_id TEXT,
    p_rss_guid TEXT DEFAULT NULL,
    p_rss_link TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    processed_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO processed_count
    FROM public.rss_processed_articles
    WHERE rss_feed_id = p_rss_feed_id
    AND (
        rss_article_id = p_rss_article_id
        OR (p_rss_guid IS NOT NULL AND rss_guid = p_rss_guid)
        OR (p_rss_link IS NOT NULL AND rss_link = p_rss_link)
    );
    
    RETURN processed_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get new RSS articles (not yet processed)
CREATE OR REPLACE FUNCTION public.get_new_rss_articles(
    p_rss_feed_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    rss_article_id TEXT,
    rss_guid TEXT,
    rss_link TEXT,
    rss_title TEXT,
    rss_pub_date TIMESTAMPTZ,
    rss_source_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rpa.rss_article_id,
        rpa.rss_guid,
        rpa.rss_link,
        rpa.rss_title,
        rpa.rss_pub_date,
        rpa.rss_source_url
    FROM public.rss_processed_articles rpa
    WHERE rpa.rss_feed_id = p_rss_feed_id
    AND rpa.is_processed = false
    ORDER BY rpa.rss_pub_date DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 11. Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS trg_rss_processed_articles_updated_at ON public.rss_processed_articles;

-- 12. Add updated_at trigger for rss_processed_articles
CREATE TRIGGER trg_rss_processed_articles_updated_at
    BEFORE UPDATE ON public.rss_processed_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 13. Success message
DO $$
BEGIN
    RAISE NOTICE 'RSS deduplication migration completed successfully!';
END $$;

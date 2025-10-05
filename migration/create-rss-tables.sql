-- Create RSS feeds table
CREATE TABLE IF NOT EXISTS rss_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RSS processed articles table for deduplication
CREATE TABLE IF NOT EXISTS rss_processed_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES rss_feeds(id) ON DELETE CASCADE,
    guid TEXT,
    content_hash TEXT,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feed_id, guid)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rss_feeds_is_active ON rss_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_processed_feed_id ON rss_processed_articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_processed_guid ON rss_processed_articles(guid);
CREATE INDEX IF NOT EXISTS idx_rss_processed_hash ON rss_processed_articles(content_hash);

-- Insert sample RSS feed (you can modify this)
-- INSERT INTO rss_feeds (source_name, url, is_active) 
-- VALUES ('Sample News', 'https://example.com/rss', true);

COMMENT ON TABLE rss_feeds IS 'Stores RSS feed sources for automated article import';
COMMENT ON TABLE rss_processed_articles IS 'Tracks processed RSS articles to prevent duplicates';

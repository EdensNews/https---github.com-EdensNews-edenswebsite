-- Create article_views table for analytics
CREATE TABLE IF NOT EXISTS article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);

-- Add RLS policies
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert view records
CREATE POLICY "Allow anyone to insert view records" ON article_views
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read view counts (for public display)
CREATE POLICY "Allow anyone to read view counts" ON article_views
    FOR SELECT USING (true);

-- Allow admins to read all view data
CREATE POLICY "Allow admins to read all view data" ON article_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

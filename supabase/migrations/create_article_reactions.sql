-- Create article_reactions table
CREATE TABLE IF NOT EXISTS article_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user ON article_reactions(user_id);

-- Enable RLS
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to article_reactions"
    ON article_reactions
    FOR SELECT
    USING (true);

-- Allow authenticated users to add/remove their own reactions
CREATE POLICY "Allow users to manage their own reactions"
    ON article_reactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create view for reaction counts
CREATE OR REPLACE VIEW article_reaction_counts AS
SELECT 
    article_id,
    reaction_type,
    COUNT(*) as count
FROM article_reactions
GROUP BY article_id, reaction_type;

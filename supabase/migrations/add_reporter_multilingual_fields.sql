-- Add multilingual reporter name fields to articles table
-- Run this migration in your Supabase SQL editor

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS reporter_kn TEXT,
ADD COLUMN IF NOT EXISTS reporter_en TEXT,
ADD COLUMN IF NOT EXISTS reporter_ta TEXT,
ADD COLUMN IF NOT EXISTS reporter_te TEXT,
ADD COLUMN IF NOT EXISTS reporter_hi TEXT,
ADD COLUMN IF NOT EXISTS reporter_ml TEXT;

-- Add comment to document the columns
COMMENT ON COLUMN articles.reporter_kn IS 'Reporter name in Kannada';
COMMENT ON COLUMN articles.reporter_en IS 'Reporter name in English';
COMMENT ON COLUMN articles.reporter_ta IS 'Reporter name in Tamil';
COMMENT ON COLUMN articles.reporter_te IS 'Reporter name in Telugu';
COMMENT ON COLUMN articles.reporter_hi IS 'Reporter name in Hindi';
COMMENT ON COLUMN articles.reporter_ml IS 'Reporter name in Malayalam';

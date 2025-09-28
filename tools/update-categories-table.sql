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
-- Add multi-language columns to articles table (idempotent)
-- Run this in Supabase SQL editor

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS title_ta text,
  ADD COLUMN IF NOT EXISTS title_te text,
  ADD COLUMN IF NOT EXISTS title_hi text,
  ADD COLUMN IF NOT EXISTS title_ml text,
  ADD COLUMN IF NOT EXISTS content_ta text,
  ADD COLUMN IF NOT EXISTS content_te text,
  ADD COLUMN IF NOT EXISTS content_hi text,
  ADD COLUMN IF NOT EXISTS content_ml text;



-- Migration: Add display_order and category to sections table
-- Run this in your Supabase SQL Editor if you've already created the tables

-- Add display_order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sections' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE sections ADD COLUMN display_order INTEGER DEFAULT 999;
    END IF;
END $$;

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sections' AND column_name = 'category'
    ) THEN
        ALTER TABLE sections ADD COLUMN category TEXT DEFAULT 'other';
    END IF;
END $$;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON sections(display_order);
CREATE INDEX IF NOT EXISTS idx_sections_category ON sections(category);


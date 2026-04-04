-- Migration: Add image columns to locations table
-- Date: 2026-04-04 22:00 CET
-- Description: Add support for multiple images per location

-- Add image columns to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_file_path TEXT,
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS image_file_paths JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN locations.image_url IS 'Primary image URL (first image)';
COMMENT ON COLUMN locations.image_file_path IS 'Primary image file path in storage (first image)';
COMMENT ON COLUMN locations.image_urls IS 'Array of image URLs (up to 5 images)';
COMMENT ON COLUMN locations.image_file_paths IS 'Array of image file paths in storage (up to 5 images)';

-- Create index for faster queries on locations with images
CREATE INDEX IF NOT EXISTS idx_locations_has_images 
ON locations USING btree (((image_urls IS NOT NULL AND jsonb_array_length(image_urls) > 0)));

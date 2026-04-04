-- =============================================================================
-- Add image fields to locations table
-- Created: 2026-03-29
-- Purpose: Support one primary photo + future mini-gallery for location wayfinding
-- =============================================================================

ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_file_path TEXT,
    ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS image_file_paths TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN locations.image_url IS 'Primary public image URL for the location';
COMMENT ON COLUMN locations.image_file_path IS 'Primary storage path for the location image';
COMMENT ON COLUMN locations.image_urls IS 'Gallery of public image URLs for the location';
COMMENT ON COLUMN locations.image_file_paths IS 'Gallery of storage paths for the location images';

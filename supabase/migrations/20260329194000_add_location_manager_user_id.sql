-- =============================================================================
-- Prepare locations.manager_user_id transition
-- Created: 2026-03-29
-- Purpose: move from free-text manager field to a proper user reference
-- =============================================================================

ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS manager_user_id UUID NULL;

COMMENT ON COLUMN locations.manager_user_id IS 'Linked user responsible for the location';

ALTER TABLE locations
    DROP CONSTRAINT IF EXISTS locations_manager_user_id_fkey;

ALTER TABLE locations
    ADD CONSTRAINT locations_manager_user_id_fkey
    FOREIGN KEY (manager_user_id)
    REFERENCES user_profiles(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_locations_manager_user_id ON locations(manager_user_id);

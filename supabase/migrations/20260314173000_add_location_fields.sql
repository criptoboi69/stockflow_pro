-- =============================================================================
-- Add missing fields to locations table
-- Created: 2026-03-14
-- Purpose: Add fields required by the Locations UI (code, status, description, 
--          occupancy, manager, phone, email, updated_at)
-- =============================================================================

-- Add missing columns to locations table
ALTER TABLE locations 
    ADD COLUMN IF NOT EXISTS code TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS occupancy INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS manager TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Update type constraint to include UI types
ALTER TABLE locations 
    DROP CONSTRAINT IF EXISTS locations_type_check;

ALTER TABLE locations 
    ADD CONSTRAINT locations_type_check 
    CHECK (type IN ('warehouse', 'showroom', 'workshop', 'truck', 'external', 'retail', 'processing', 'transit'));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to be role-based
DROP POLICY IF EXISTS "locations_insert" ON locations;
DROP POLICY IF EXISTS "locations_update" ON locations;
DROP POLICY IF EXISTS "locations_delete" ON locations;

-- Allow insert for admin and super_admin roles
CREATE POLICY "locations_insert" ON locations 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_company_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.company_id = locations.company_id
            AND ucr.role IN ('super_admin', 'admin')
            AND ucr.is_active = true
        )
    );

-- Allow update for admin and super_admin roles
CREATE POLICY "locations_update" ON locations 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_company_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.company_id = locations.company_id
            AND ucr.role IN ('super_admin', 'admin')
            AND ucr.is_active = true
        )
    );

-- Allow delete for admin and super_admin roles only
CREATE POLICY "locations_delete" ON locations 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_company_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.company_id = locations.company_id
            AND ucr.role IN ('super_admin', 'admin')
            AND ucr.is_active = true
        )
    );

-- Ensure read policy allows all active users in the company
DROP POLICY IF EXISTS "locations_read" ON locations;
CREATE POLICY "locations_read" ON locations 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_company_roles ucr
            WHERE ucr.user_id = auth.uid()
            AND ucr.company_id = locations.company_id
            AND ucr.is_active = true
        )
    );

-- =====================================================
-- SECURITY FIX: Enable RLS on exposed tables
-- =====================================================

-- =====================================================
-- 1. TABLE: invitations
-- =====================================================

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "invitations_select_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_insert_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_update_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_delete_super_admin" ON invitations;

-- Policy: Users can see their own invitations (by email)
CREATE POLICY "invitations_select_own"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt()->>'email' 
    OR 
    auth.jwt()->>'role' = 'super_admin'
  );

-- Policy: Allow invitation creation (for user management)
CREATE POLICY "invitations_insert_company_member"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_company_roles
      WHERE user_id = auth.uid()
      AND company_id = invitations.company_id
      AND role IN ('super_admin', 'administrator')
    )
  );

-- Policy: Allow updating own invitation
CREATE POLICY "invitations_update_own"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- Policy: Super admin can delete any invitation
CREATE POLICY "invitations_delete_super_admin"
  ON invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_company_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
      )
    )
  );

-- =====================================================
-- 2. TABLE: data_operations
-- =====================================================

-- Enable RLS
ALTER TABLE data_operations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "data_operations_select_authenticated" ON data_operations;
DROP POLICY IF EXISTS "data_operations_insert_authenticated" ON data_operations;

-- Policy: Users can see operations from their companies
CREATE POLICY "data_operations_select_company"
  ON data_operations
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_company_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow inserting operations (for users in companies)
CREATE POLICY "data_operations_insert_company"
  ON data_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_company_roles 
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'administrator', 'manager')
    )
  );

-- =====================================================
-- 3. Hide sensitive columns from invitations table
-- =====================================================

-- Note: Supabase doesn't support column-level RLS directly
-- Solution: Create a view that excludes sensitive columns

-- Drop existing view if exists
DROP VIEW IF EXISTS public.invitations_safe;

-- Create safe view (excludes token, expires_at, etc.)
CREATE VIEW public.invitations_safe AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  company_id,
  role,
  invited_by,
  status,
  created_at,
  updated_at
FROM invitations;

-- Grant access to the safe view
GRANT SELECT ON public.invitations_safe TO authenticated;

-- Comment: 
-- - Raw invitations table: RLS enabled, only accessible via policies
-- - Safe view: Excludes sensitive columns (token, expires_at)
-- - API should use the safe view for general queries

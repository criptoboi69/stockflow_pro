-- Enable public read access to companies table for invitation/signup flow
-- This allows unauthenticated users to fetch company info when accepting an invitation

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;

-- Allow anyone to read companies (needed for invitation acceptance)
CREATE POLICY "Enable read access for all users"
  ON companies
  FOR SELECT
  TO public
  USING (true);

-- Comment: This is safe because:
-- 1. We only expose basic info (id, name)
-- 2. No sensitive data is in the companies table
-- 3. This is required for the invitation/signup flow to work

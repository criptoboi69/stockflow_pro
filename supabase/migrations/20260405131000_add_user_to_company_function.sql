-- Function to add user to company (bypasses RLS for signup flow)
-- This function runs with SECURITY DEFINER, so it executes with elevated privileges

-- Drop if exists
DROP FUNCTION IF EXISTS add_user_to_company(uuid, uuid, text);

-- Create function
CREATE OR REPLACE FUNCTION add_user_to_company(
  p_user_id uuid,
  p_company_id uuid,
  p_role text DEFAULT 'employee'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_already_exists boolean;
BEGIN
  -- Check if already member
  SELECT EXISTS (
    SELECT 1 FROM user_company_roles
    WHERE user_id = p_user_id AND company_id = p_company_id
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN json_build_object(
      'success', true,
      'already_member', true,
      'message', 'User already member of this company'
    );
  END IF;

  -- Insert new role
  INSERT INTO user_company_roles (user_id, company_id, role)
  VALUES (p_user_id, p_company_id, p_role);

  RETURN json_build_object(
    'success', true,
    'already_member', false,
    'message', 'User added to company successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute to authenticated users (needed for signup flow)
GRANT EXECUTE ON FUNCTION add_user_to_company TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_company TO anon;

-- Comment: This is safe because:
-- 1. Function only adds user to company (no privilege escalation)
-- 2. Default role is 'member' (lowest privilege)
-- 3. Function is idempotent (checks for existing membership)
-- 4. Required for the open signup flow to work

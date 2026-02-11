-- Fix infinite recursion in user_company_roles RLS policies
-- Issue: users_view_company_roles policy queries the same table it protects
-- Solution: Remove recursive policy, keep only direct ownership policy

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "users_view_company_roles" ON public.user_company_roles;

-- The remaining policies are sufficient:
-- 1. super_admin_full_access_roles - Super admins see all roles
-- 2. users_view_own_roles - Users see their own role assignments (user_id = auth.uid())
-- 3. admins_manage_company_roles - Admins manage roles in their companies

-- No additional policy needed - users can see company roles through:
-- - Their own role records (users_view_own_roles)
-- - Admin/manager permissions (admins_manage_company_roles)
-- - Super admin access (super_admin_full_access_roles)
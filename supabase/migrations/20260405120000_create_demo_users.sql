-- Migration: Create Demo Users for Testing
-- Date: 2026-04-05 12:00 CET
-- Description: Creates 4 demo users with different roles for testing permissions

-- Get or create the default company
INSERT INTO companies (name, status, created_at)
SELECT 'TechCorp Demo', 'active', now()
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'TechCorp Demo');

-- Get company ID
DO $$
DECLARE
  default_company_id UUID;
BEGIN
  SELECT id INTO default_company_id FROM companies WHERE name = 'TechCorp Demo' LIMIT 1;

  -- Create Super Admin user
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'superadmin@stockflow.fr',
    crypt('SuperAdmin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"email":"superadmin@stockflow.fr","full_name":"Super Admin"}',
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@stockflow.fr');

  -- Create Admin user
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@techcorp.fr',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"email":"admin@techcorp.fr","full_name":"Admin User"}',
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@techcorp.fr');

  -- Create Manager user
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'manager@techcorp.fr',
    crypt('Manager123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"email":"manager@techcorp.fr","full_name":"Manager User"}',
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@techcorp.fr');

  -- Create User (basic)
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  SELECT 
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user@techcorp.fr',
    crypt('User123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"email":"user@techcorp.fr","full_name":"Basic User"}',
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@techcorp.fr');

  -- Create user_profiles for each user
  INSERT INTO user_profiles (id, email, full_name, role, created_at)
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name',
    CASE 
      WHEN u.email = 'superadmin@stockflow.fr' THEN 'super_admin'
      WHEN u.email = 'admin@techcorp.fr' THEN 'administrator'
      WHEN u.email = 'manager@techcorp.fr' THEN 'manager'
      ELSE 'user'
    END,
    now()
  FROM auth.users u
  WHERE u.email IN (
    'superadmin@stockflow.fr',
    'admin@techcorp.fr',
    'manager@techcorp.fr',
    'user@techcorp.fr'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- Assign users to the company with appropriate roles
  INSERT INTO user_company_roles (user_id, company_id, role, is_primary, created_at)
  SELECT 
    u.id,
    default_company_id,
    CASE 
      WHEN u.email = 'superadmin@stockflow.fr' THEN 'super_admin'
      WHEN u.email = 'admin@techcorp.fr' THEN 'administrator'
      WHEN u.email = 'manager@techcorp.fr' THEN 'manager'
      ELSE 'user'
    END,
    true,
    now()
  FROM auth.users u
  WHERE u.email IN (
    'superadmin@stockflow.fr',
    'admin@techcorp.fr',
    'manager@techcorp.fr',
    'user@techcorp.fr'
  )
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_primary = EXCLUDED.is_primary;

  RAISE NOTICE 'Demo users created successfully!';
END $$;

-- Display created users
SELECT 
  u.email,
  p.role,
  ucr.role as company_role,
  c.name as company_name
FROM auth.users u
JOIN user_profiles p ON u.id = p.id
JOIN user_company_roles ucr ON u.id = ucr.user_id
JOIN companies c ON ucr.company_id = c.id
WHERE u.email IN (
  'superadmin@stockflow.fr',
  'admin@techcorp.fr',
  'manager@techcorp.fr',
  'user@techcorp.fr'
);

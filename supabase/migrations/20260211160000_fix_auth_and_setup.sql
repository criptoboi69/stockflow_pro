-- Comprehensive Auth Diagnostic and Fix Migration
-- This migration diagnoses and fixes authentication issues

-- Step 1: Diagnostic - Check current state
DO $$
DECLARE
    auth_user_count INTEGER;
    profile_count INTEGER;
    company_role_count INTEGER;
    company_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    SELECT COUNT(*) INTO company_role_count FROM public.user_company_roles;
    SELECT COUNT(*) INTO company_count FROM public.companies;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'AUTHENTICATION DIAGNOSTIC REPORT';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Auth Users: %', auth_user_count;
    RAISE NOTICE 'User Profiles: %', profile_count;
    RAISE NOTICE 'Company Roles: %', company_role_count;
    RAISE NOTICE 'Companies: %', company_count;
    RAISE NOTICE '============================================';
    
    IF auth_user_count = 0 THEN
        RAISE NOTICE 'CRITICAL: No users found in auth.users table!';
        RAISE NOTICE 'Users must be created via Supabase Dashboard:';
        RAISE NOTICE '1. Go to Authentication → Users';
        RAISE NOTICE '2. Click "Add User" for each demo account';
        RAISE NOTICE '3. IMPORTANT: Check "Auto Confirm User" option';
        RAISE NOTICE '';
        RAISE NOTICE 'Demo accounts to create:';
        RAISE NOTICE '  - superadmin@stockflow.fr / SuperAdmin123!';
        RAISE NOTICE '  - admin@techcorp.fr / Admin123!';
        RAISE NOTICE '  - manager@techcorp.fr / Manager123!';
        RAISE NOTICE '  - user@techcorp.fr / User123!';
    ELSIF auth_user_count > 0 AND profile_count = 0 THEN
        RAISE NOTICE 'ISSUE: Users exist but no profiles created';
        RAISE NOTICE 'Running automatic profile creation...';
    ELSIF auth_user_count > 0 AND company_role_count = 0 THEN
        RAISE NOTICE 'ISSUE: Profiles exist but no company roles assigned';
        RAISE NOTICE 'Running automatic role assignment...';
    ELSE
        RAISE NOTICE 'Database structure looks good';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;

-- Step 2: Ensure companies exist
DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
BEGIN
    -- Get or create TechCorp Solutions
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    IF company1_uuid IS NULL THEN
        company1_uuid := gen_random_uuid();
        INSERT INTO public.companies (id, name, email, phone, address, city, postal_code, country, max_users, status)
        VALUES (
            company1_uuid,
            'TechCorp Solutions',
            'admin@techcorp.fr',
            '+33 1 23 45 67 89',
            '123 Avenue des Champs-Élysées',
            'Paris',
            '75008',
            'France',
            25,
            'active'::public.company_status
        );
        RAISE NOTICE 'Created company: TechCorp Solutions (ID: %)', company1_uuid;
    ELSE
        RAISE NOTICE 'Company exists: TechCorp Solutions (ID: %)', company1_uuid;
    END IF;
    
    -- Get or create InnovateLab
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    IF company2_uuid IS NULL THEN
        company2_uuid := gen_random_uuid();
        INSERT INTO public.companies (id, name, email, phone, address, city, postal_code, country, max_users, status)
        VALUES (
            company2_uuid,
            'InnovateLab',
            'contact@innovatelab.fr',
            '+33 4 56 78 90 12',
            '456 Rue de la République',
            'Lyon',
            '69002',
            'France',
            15,
            'active'::public.company_status
        );
        RAISE NOTICE 'Created company: InnovateLab (ID: %)', company2_uuid;
    ELSE
        RAISE NOTICE 'Company exists: InnovateLab (ID: %)', company2_uuid;
    END IF;
END $$;

-- Step 3: Create or update profiles for existing auth users
DO $$
DECLARE
    user_record RECORD;
    profile_exists BOOLEAN;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SYNCING AUTH USERS TO PROFILES';
    RAISE NOTICE '============================================';
    
    FOR user_record IN SELECT id, email, raw_user_meta_data FROM auth.users
    LOOP
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = user_record.id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
                COALESCE(user_record.raw_user_meta_data->>'avatar_url', '')
            );
            RAISE NOTICE 'Created profile for: %', user_record.email;
        ELSE
            RAISE NOTICE 'Profile already exists for: %', user_record.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '============================================';
END $$;

-- Step 4: Assign company roles for demo accounts
DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    user_record RECORD;
    role_exists BOOLEAN;
BEGIN
    -- Get companies
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ASSIGNING COMPANY ROLES';
    RAISE NOTICE '============================================';
    
    -- Process each demo user
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        WHERE au.email IN (
            'superadmin@stockflow.fr',
            'admin@techcorp.fr',
            'manager@techcorp.fr',
            'user@techcorp.fr'
        )
    LOOP
        IF user_record.email = 'superadmin@stockflow.fr' THEN
            -- Super admin gets access to both companies
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES 
                (user_record.id, company1_uuid, 'super_admin'::public.user_role, true),
                (user_record.id, company2_uuid, 'super_admin'::public.user_role, false)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            RAISE NOTICE 'Assigned super_admin role to: %', user_record.email;
            
        ELSIF user_record.email = 'admin@techcorp.fr' THEN
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (user_record.id, company1_uuid, 'administrator'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            RAISE NOTICE 'Assigned administrator role to: %', user_record.email;
            
        ELSIF user_record.email = 'manager@techcorp.fr' THEN
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (user_record.id, company1_uuid, 'manager'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            RAISE NOTICE 'Assigned manager role to: %', user_record.email;
            
        ELSIF user_record.email = 'user@techcorp.fr' THEN
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (user_record.id, company1_uuid, 'user'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            RAISE NOTICE 'Assigned user role to: %', user_record.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '============================================';
END $$;

-- Step 5: Enhanced trigger to auto-create profiles and assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company1_uuid UUID;
    user_role_value public.user_role;
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Auto-assign company and role for demo accounts
    IF NEW.email IN ('superadmin@stockflow.fr', 'admin@techcorp.fr', 'manager@techcorp.fr', 'user@techcorp.fr') THEN
        -- Get TechCorp Solutions company
        SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
        
        IF company1_uuid IS NOT NULL THEN
            -- Determine role based on email
            IF NEW.email = 'superadmin@stockflow.fr' THEN
                user_role_value := 'super_admin'::public.user_role;
            ELSIF NEW.email = 'admin@techcorp.fr' THEN
                user_role_value := 'administrator'::public.user_role;
            ELSIF NEW.email = 'manager@techcorp.fr' THEN
                user_role_value := 'manager'::public.user_role;
            ELSE
                user_role_value := 'user'::public.user_role;
            END IF;
            
            -- Assign role
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (NEW.id, company1_uuid, user_role_value, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Final diagnostic
DO $$
DECLARE
    auth_user_count INTEGER;
    profile_count INTEGER;
    company_role_count INTEGER;
    user_record RECORD;
BEGIN
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    SELECT COUNT(*) INTO company_role_count FROM public.user_company_roles;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Auth Users: %', auth_user_count;
    RAISE NOTICE 'User Profiles: %', profile_count;
    RAISE NOTICE 'Company Roles: %', company_role_count;
    RAISE NOTICE '';
    
    IF auth_user_count > 0 THEN
        RAISE NOTICE 'User Details:';
        FOR user_record IN 
            SELECT 
                au.email,
                au.email_confirmed_at,
                up.full_name,
                ucr.role::TEXT as role,
                c.name as company_name
            FROM auth.users au
            LEFT JOIN public.user_profiles up ON au.id = up.id
            LEFT JOIN public.user_company_roles ucr ON au.id = ucr.user_id AND ucr.is_primary = true
            LEFT JOIN public.companies c ON ucr.company_id = c.id
            ORDER BY au.email
        LOOP
            RAISE NOTICE '  % - Confirmed: % - Role: % - Company: %', 
                user_record.email,
                CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN 'YES' ELSE 'NO' END,
                COALESCE(user_record.role, 'NONE'),
                COALESCE(user_record.company_name, 'NONE');
        END LOOP;
    ELSE
        RAISE NOTICE 'NO USERS FOUND - MANUAL CREATION REQUIRED';
        RAISE NOTICE '';
        RAISE NOTICE 'Go to Supabase Dashboard → Authentication → Users';
        RAISE NOTICE 'Click "Add User" and ENABLE "Auto Confirm User"';
    END IF;
    
    RAISE NOTICE '============================================';
END $$;
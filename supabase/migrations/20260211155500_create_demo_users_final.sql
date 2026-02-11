-- Final Demo Users Creation Migration
-- This migration creates demo accounts for testing the multi-tenant system

-- CRITICAL: This migration uses a workaround for Supabase's auth restrictions
-- The auth.users table requires special permissions that migrations don't have

-- Step 1: Ensure companies exist
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
        RAISE NOTICE 'Created company: TechCorp Solutions';
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
        RAISE NOTICE 'Created company: InnovateLab';
    END IF;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Companies created successfully';
    RAISE NOTICE 'TechCorp Solutions ID: %', company1_uuid;
    RAISE NOTICE 'InnovateLab ID: %', company2_uuid;
    RAISE NOTICE '============================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating companies: %', SQLERRM;
END $$;

-- Step 2: Create a function to setup demo users (callable after manual user creation)
CREATE OR REPLACE FUNCTION public.setup_demo_accounts()
RETURNS TABLE(
    email TEXT,
    status TEXT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    user_record RECORD;
    result_status TEXT;
    result_message TEXT;
BEGIN
    -- Get companies
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    
    -- Process each demo user email
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        WHERE au.email IN (
            'superadmin@stockflow.fr',
            'admin@techcorp.fr',
            'manager@techcorp.fr',
            'user@techcorp.fr'
        )
    LOOP
        BEGIN
            -- Create or update user_profile
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
                COALESCE(user_record.raw_user_meta_data->>'avatar_url', '')
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url,
                updated_at = CURRENT_TIMESTAMP;
            
            -- Assign roles based on email
            IF user_record.email = 'superadmin@stockflow.fr' THEN
                -- Super admin gets access to both companies
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                VALUES 
                    (user_record.id, company1_uuid, 'super_admin'::public.user_role, true),
                    (user_record.id, company2_uuid, 'super_admin'::public.user_role, false)
                ON CONFLICT (user_id, company_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_primary = EXCLUDED.is_primary;
                    
                result_status := 'SUCCESS';
                result_message := 'Super admin configured with access to all companies';
                
            ELSIF user_record.email = 'admin@techcorp.fr' THEN
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                VALUES (user_record.id, company1_uuid, 'administrator'::public.user_role, true)
                ON CONFLICT (user_id, company_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_primary = EXCLUDED.is_primary;
                    
                result_status := 'SUCCESS';
                result_message := 'Administrator configured for TechCorp Solutions';
                
            ELSIF user_record.email = 'manager@techcorp.fr' THEN
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                VALUES (user_record.id, company1_uuid, 'manager'::public.user_role, true)
                ON CONFLICT (user_id, company_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_primary = EXCLUDED.is_primary;
                    
                result_status := 'SUCCESS';
                result_message := 'Manager configured for TechCorp Solutions';
                
            ELSIF user_record.email = 'user@techcorp.fr' THEN
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                VALUES (user_record.id, company1_uuid, 'user'::public.user_role, true)
                ON CONFLICT (user_id, company_id) DO UPDATE SET
                    role = EXCLUDED.role,
                    is_primary = EXCLUDED.is_primary;
                    
                result_status := 'SUCCESS';
                result_message := 'User configured for TechCorp Solutions';
            END IF;
            
            RETURN QUERY SELECT user_record.email, result_status, result_message;
            
        EXCEPTION
            WHEN OTHERS THEN
                RETURN QUERY SELECT user_record.email, 'ERROR'::TEXT, SQLERRM;
        END;
    END LOOP;
    
    -- Check if no users were found
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            'NO_USERS'::TEXT,
            'WARNING'::TEXT,
            'No demo users found in auth.users. Please create them manually via Supabase Dashboard.'::TEXT;
    END IF;
    
END;
$$;

-- Step 3: Attempt to call the setup function (will show status)
DO $$
DECLARE
    setup_result RECORD;
    user_count INTEGER;
BEGIN
    -- Check current user count
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEMO USERS SETUP STATUS';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Current users in auth.users: %', user_count;
    RAISE NOTICE '';
    
    IF user_count = 0 THEN
        RAISE NOTICE 'NO USERS FOUND IN DATABASE';
        RAISE NOTICE '';
        RAISE NOTICE 'MANUAL SETUP REQUIRED:';
        RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
        RAISE NOTICE '2. Click "Add User" and create these accounts:';
        RAISE NOTICE '';
        RAISE NOTICE '   Super Admin:';
        RAISE NOTICE '   - Email: superadmin@stockflow.fr';
        RAISE NOTICE '   - Password: SuperAdmin123!';
        RAISE NOTICE '   - Metadata: {"full_name": "Super Admin"}';
        RAISE NOTICE '';
        RAISE NOTICE '   Administrator:';
        RAISE NOTICE '   - Email: admin@techcorp.fr';
        RAISE NOTICE '   - Password: Admin123!';
        RAISE NOTICE '   - Metadata: {"full_name": "Marie Dubois"}';
        RAISE NOTICE '';
        RAISE NOTICE '   Manager:';
        RAISE NOTICE '   - Email: manager@techcorp.fr';
        RAISE NOTICE '   - Password: Manager123!';
        RAISE NOTICE '   - Metadata: {"full_name": "Pierre Martin"}';
        RAISE NOTICE '';
        RAISE NOTICE '   User:';
        RAISE NOTICE '   - Email: user@techcorp.fr';
        RAISE NOTICE '   - Password: User123!';
        RAISE NOTICE '   - Metadata: {"full_name": "Sophie Laurent"}';
        RAISE NOTICE '';
        RAISE NOTICE '3. After creating users, the trigger will automatically:';
        RAISE NOTICE '   - Create user profiles';
        RAISE NOTICE '   - Assign company roles';
        RAISE NOTICE '   - Set up permissions';
        RAISE NOTICE '';
        RAISE NOTICE 'OR use SQL Editor to call: SELECT * FROM public.setup_demo_accounts();';
    ELSE
        RAISE NOTICE 'Found % users in database', user_count;
        RAISE NOTICE 'Running setup function...';
        RAISE NOTICE '';
        
        FOR setup_result IN SELECT * FROM public.setup_demo_accounts()
        LOOP
            RAISE NOTICE '% - %: %', setup_result.email, setup_result.status, setup_result.message;
        END LOOP;
    END IF;
    
    RAISE NOTICE '============================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Setup check failed: %', SQLERRM;
END $$;

-- Step 4: Update the trigger to handle demo user metadata
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
    ON CONFLICT (id) DO NOTHING;
    
    -- Auto-assign roles for demo accounts
    IF NEW.email IN ('superadmin@stockflow.fr', 'admin@techcorp.fr', 'manager@techcorp.fr', 'user@techcorp.fr') THEN
        -- Get TechCorp company
        SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
        
        IF company1_uuid IS NOT NULL THEN
            -- Determine role based on email
            IF NEW.email = 'superadmin@stockflow.fr' THEN
                user_role_value := 'super_admin'::public.user_role;
                
                -- Super admin gets both companies
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                SELECT NEW.id, id, 'super_admin'::public.user_role, (name = 'TechCorp Solutions')
                FROM public.companies
                WHERE name IN ('TechCorp Solutions', 'InnovateLab')
                ON CONFLICT (user_id, company_id) DO NOTHING;
                
            ELSIF NEW.email = 'admin@techcorp.fr' THEN
                user_role_value := 'administrator'::public.user_role;
            ELSIF NEW.email = 'manager@techcorp.fr' THEN
                user_role_value := 'manager'::public.user_role;
            ELSE
                user_role_value := 'user'::public.user_role;
            END IF;
            
            -- Assign to TechCorp (except super admin which was already handled)
            IF NEW.email != 'superadmin@stockflow.fr' THEN
                INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
                VALUES (NEW.id, company1_uuid, user_role_value, true)
                ON CONFLICT (user_id, company_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
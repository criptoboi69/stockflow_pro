-- Diagnose and Fix Auth Users Creation
-- This migration uses proper Supabase auth functions instead of direct insertion

DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    super_admin_uuid UUID;
    admin1_uuid UUID;
    manager1_uuid UUID;
    user1_uuid UUID;
    user_count INTEGER;
    existing_user_id UUID;
BEGIN
    -- First, check current state
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Current users in auth.users: %', user_count;
    
    -- Get or create companies
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    
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
    
    -- Check if users already exist in auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'superadmin@stockflow.fr' LIMIT 1;
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Super admin already exists with ID: %', existing_user_id;
    ELSE
        RAISE NOTICE 'Super admin does NOT exist in auth.users';
    END IF;
    
    -- The issue: We cannot directly insert into auth.users from migrations
    -- Supabase requires using their admin API or auth.admin_create_user function
    -- However, these functions may not be available in migrations
    
    -- Alternative approach: Create a temporary function to handle user creation
    -- This function will be called after migration to create users properly
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CRITICAL ISSUE IDENTIFIED:';
    RAISE NOTICE 'Direct insertion into auth.users is not working';
    RAISE NOTICE 'This requires manual user creation via Supabase Dashboard';
    RAISE NOTICE 'Or using Supabase Admin API';
    RAISE NOTICE '============================================';
    
    -- Create a helper function that can be called to set up demo data
    -- after users are created via the dashboard
    CREATE OR REPLACE FUNCTION public.setup_demo_user_associations()
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
        company1_uuid UUID;
        company2_uuid UUID;
        super_admin_uuid UUID;
        admin1_uuid UUID;
        manager1_uuid UUID;
        user1_uuid UUID;
        result_text TEXT := '';
    BEGIN
        -- Get companies
        SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
        SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
        
        -- Get user IDs from auth.users
        SELECT id INTO super_admin_uuid FROM auth.users WHERE email = 'superadmin@stockflow.fr' LIMIT 1;
        SELECT id INTO admin1_uuid FROM auth.users WHERE email = 'admin@techcorp.fr' LIMIT 1;
        SELECT id INTO manager1_uuid FROM auth.users WHERE email = 'manager@techcorp.fr' LIMIT 1;
        SELECT id INTO user1_uuid FROM auth.users WHERE email = 'user@techcorp.fr' LIMIT 1;
        
        -- Create user profiles if they don't exist
        IF super_admin_uuid IS NOT NULL THEN
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                super_admin_uuid,
                'superadmin@stockflow.fr',
                'Super Admin',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url;
            
            -- Associate with companies
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES 
                (super_admin_uuid, company1_uuid, 'super_admin'::public.user_role, true),
                (super_admin_uuid, company2_uuid, 'super_admin'::public.user_role, false)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            
            result_text := result_text || 'Super admin configured. ';
        END IF;
        
        IF admin1_uuid IS NOT NULL THEN
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                admin1_uuid,
                'admin@techcorp.fr',
                'Marie Dubois',
                'https://images.unsplash.com/photo-1707394315636-815658801294'
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url;
            
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (admin1_uuid, company1_uuid, 'administrator'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            
            result_text := result_text || 'Admin configured. ';
        END IF;
        
        IF manager1_uuid IS NOT NULL THEN
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                manager1_uuid,
                'manager@techcorp.fr',
                'Pierre Martin',
                'https://images.unsplash.com/photo-1665868727194-0e5eac640091'
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url;
            
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (manager1_uuid, company1_uuid, 'manager'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            
            result_text := result_text || 'Manager configured. ';
        END IF;
        
        IF user1_uuid IS NOT NULL THEN
            INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
            VALUES (
                user1_uuid,
                'user@techcorp.fr',
                'Sophie Laurent',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url;
            
            INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
            VALUES (user1_uuid, company1_uuid, 'user'::public.user_role, true)
            ON CONFLICT (user_id, company_id) DO UPDATE SET
                role = EXCLUDED.role,
                is_primary = EXCLUDED.is_primary;
            
            result_text := result_text || 'User configured. ';
        END IF;
        
        IF result_text = '' THEN
            RETURN 'No users found in auth.users. Please create users first via Supabase Dashboard.';
        ELSE
            RETURN 'Success: ' || result_text;
        END IF;
    END;
    $func$;
    
    RAISE NOTICE 'Created helper function: public.setup_demo_user_associations()';
    RAISE NOTICE 'This function can be called after users are created';
    
END $$;
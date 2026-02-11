-- Fix Demo Users Creation
-- This migration ensures demo accounts are properly created in both auth.users and user_profiles

DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    super_admin_uuid UUID;
    admin1_uuid UUID;
    manager1_uuid UUID;
    user1_uuid UUID;
    user_count INTEGER;
BEGIN
    -- Get existing companies
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    
    -- Create companies if they don't exist
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
        RAISE NOTICE 'Created company: TechCorp Solutions with ID %', company1_uuid;
    ELSE
        RAISE NOTICE 'Company TechCorp Solutions already exists with ID %', company1_uuid;
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
        RAISE NOTICE 'Created company: InnovateLab with ID %', company2_uuid;
    ELSE
        RAISE NOTICE 'Company InnovateLab already exists with ID %', company2_uuid;
    END IF;
    
    -- Check if super admin exists in auth.users
    SELECT id INTO super_admin_uuid FROM auth.users WHERE email = 'superadmin@stockflow.fr' LIMIT 1;
    
    IF super_admin_uuid IS NULL THEN
        super_admin_uuid := gen_random_uuid();
        
        -- Insert into auth.users with all required fields
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data,
            raw_app_meta_data,
            is_sso_user,
            is_anonymous,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            email_change_token_current,
            email_change_confirm_status,
            reauthentication_token,
            phone,
            phone_change,
            phone_change_token
        ) VALUES (
            super_admin_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'superadmin@stockflow.fr',
            crypt('SuperAdmin123!', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Super Admin', 'avatar_url', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false,
            false,
            '',
            '',
            '',
            '',
            '',
            0,
            '',
            null,
            '',
            ''
        );
        
        -- Manually insert into user_profiles (don't rely on trigger)
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            super_admin_uuid,
            'superadmin@stockflow.fr',
            'Super Admin',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Associate with both companies as super_admin
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES 
            (super_admin_uuid, company1_uuid, 'super_admin'::public.user_role, true),
            (super_admin_uuid, company2_uuid, 'super_admin'::public.user_role, false)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created super admin user with ID %', super_admin_uuid;
    ELSE
        RAISE NOTICE 'Super admin already exists with ID %', super_admin_uuid;
        
        -- Ensure super admin has company associations
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES 
            (super_admin_uuid, company1_uuid, 'super_admin'::public.user_role, true),
            (super_admin_uuid, company2_uuid, 'super_admin'::public.user_role, false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check if admin exists
    SELECT id INTO admin1_uuid FROM auth.users WHERE email = 'admin@techcorp.fr' LIMIT 1;
    
    IF admin1_uuid IS NULL THEN
        admin1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, recovery_token,
            email_change_token_new, email_change, email_change_token_current,
            email_change_confirm_status, reauthentication_token, phone,
            phone_change, phone_change_token
        ) VALUES (
            admin1_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin@techcorp.fr',
            crypt('Admin123!', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Marie Dubois', 'avatar_url', 'https://images.unsplash.com/photo-1707394315636-815658801294'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', '', '', '', '', 0, '', null, '', ''
        );
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            admin1_uuid,
            'admin@techcorp.fr',
            'Marie Dubois',
            'https://images.unsplash.com/photo-1707394315636-815658801294'
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (admin1_uuid, company1_uuid, 'administrator'::public.user_role, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created admin user with ID %', admin1_uuid;
    ELSE
        RAISE NOTICE 'Admin already exists with ID %', admin1_uuid;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (admin1_uuid, company1_uuid, 'administrator'::public.user_role, true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check if manager exists
    SELECT id INTO manager1_uuid FROM auth.users WHERE email = 'manager@techcorp.fr' LIMIT 1;
    
    IF manager1_uuid IS NULL THEN
        manager1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, recovery_token,
            email_change_token_new, email_change, email_change_token_current,
            email_change_confirm_status, reauthentication_token, phone,
            phone_change, phone_change_token
        ) VALUES (
            manager1_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'manager@techcorp.fr',
            crypt('Manager123!', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Pierre Martin', 'avatar_url', 'https://images.unsplash.com/photo-1665868727194-0e5eac640091'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', '', '', '', '', 0, '', null, '', ''
        );
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            manager1_uuid,
            'manager@techcorp.fr',
            'Pierre Martin',
            'https://images.unsplash.com/photo-1665868727194-0e5eac640091'
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (manager1_uuid, company1_uuid, 'manager'::public.user_role, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created manager user with ID %', manager1_uuid;
    ELSE
        RAISE NOTICE 'Manager already exists with ID %', manager1_uuid;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (manager1_uuid, company1_uuid, 'manager'::public.user_role, true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check if regular user exists
    SELECT id INTO user1_uuid FROM auth.users WHERE email = 'user@techcorp.fr' LIMIT 1;
    
    IF user1_uuid IS NULL THEN
        user1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, recovery_token,
            email_change_token_new, email_change, email_change_token_current,
            email_change_confirm_status, reauthentication_token, phone,
            phone_change, phone_change_token
        ) VALUES (
            user1_uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'user@techcorp.fr',
            crypt('User123!', gen_salt('bf', 10)),
            now(),
            now(),
            now(),
            jsonb_build_object('full_name', 'Sophie Laurent', 'avatar_url', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false, false, '', '', '', '', '', 0, '', null, '', ''
        );
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            user1_uuid,
            'user@techcorp.fr',
            'Sophie Laurent',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (user1_uuid, company1_uuid, 'user'::public.user_role, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created regular user with ID %', user1_uuid;
    ELSE
        RAISE NOTICE 'Regular user already exists with ID %', user1_uuid;
        
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (user1_uuid, company1_uuid, 'user'::public.user_role, true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Verify user creation
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE email IN (
        'superadmin@stockflow.fr',
        'admin@techcorp.fr',
        'manager@techcorp.fr',
        'user@techcorp.fr'
    );
    
    RAISE NOTICE 'Total demo users in auth.users: %', user_count;
    
    IF user_count < 4 THEN
        RAISE EXCEPTION 'Failed to create all demo users. Only % users found.', user_count;
    END IF;
    
END $$;
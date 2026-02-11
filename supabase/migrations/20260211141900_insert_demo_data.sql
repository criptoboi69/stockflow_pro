-- Insert Demo Companies and User-Company Associations
-- This migration ensures all existing users have company access

DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    super_admin_uuid UUID;
    admin1_uuid UUID;
    manager1_uuid UUID;
    user1_uuid UUID;
BEGIN
    -- Check if companies already exist
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
        )
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Created company: TechCorp Solutions';
    ELSE
        RAISE NOTICE 'Company TechCorp Solutions already exists';
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
        )
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Created company: InnovateLab';
    ELSE
        RAISE NOTICE 'Company InnovateLab already exists';
    END IF;
    
    -- Get existing user IDs from user_profiles
    SELECT id INTO super_admin_uuid FROM public.user_profiles WHERE email = 'superadmin@stockflow.fr' LIMIT 1;
    SELECT id INTO admin1_uuid FROM public.user_profiles WHERE email = 'admin@techcorp.fr' LIMIT 1;
    SELECT id INTO manager1_uuid FROM public.user_profiles WHERE email = 'manager@techcorp.fr' LIMIT 1;
    SELECT id INTO user1_uuid FROM public.user_profiles WHERE email = 'user@techcorp.fr' LIMIT 1;
    
    -- If demo users don't exist, create them in auth.users AND user_profiles
    IF super_admin_uuid IS NULL THEN
        super_admin_uuid := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
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
            null,
            '',
            null,
            '',
            '',
            null,
            '',
            0,
            '',
            null,
            null,
            '',
            '',
            null
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Immediately insert into user_profiles (don't rely on trigger)
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            super_admin_uuid,
            'superadmin@stockflow.fr',
            'Super Admin',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created user: superadmin@stockflow.fr';
    ELSE
        RAISE NOTICE 'User superadmin@stockflow.fr already exists';
    END IF;
    
    IF admin1_uuid IS NULL THEN
        admin1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
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
            false,
            false,
            '',
            null,
            '',
            null,
            '',
            '',
            null,
            '',
            0,
            '',
            null,
            null,
            '',
            '',
            null
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            admin1_uuid,
            'admin@techcorp.fr',
            'Marie Dubois',
            'https://images.unsplash.com/photo-1707394315636-815658801294'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created user: admin@techcorp.fr';
    ELSE
        RAISE NOTICE 'User admin@techcorp.fr already exists';
    END IF;
    
    IF manager1_uuid IS NULL THEN
        manager1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
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
            false,
            false,
            '',
            null,
            '',
            null,
            '',
            '',
            null,
            '',
            0,
            '',
            null,
            null,
            '',
            '',
            null
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            manager1_uuid,
            'manager@techcorp.fr',
            'Pierre Martin',
            'https://images.unsplash.com/photo-1665868727194-0e5eac640091'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created user: manager@techcorp.fr';
    ELSE
        RAISE NOTICE 'User manager@techcorp.fr already exists';
    END IF;
    
    IF user1_uuid IS NULL THEN
        user1_uuid := gen_random_uuid();
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
            is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
            recovery_token, recovery_sent_at, email_change_token_new, email_change,
            email_change_sent_at, email_change_token_current, email_change_confirm_status,
            reauthentication_token, reauthentication_sent_at, phone, phone_change,
            phone_change_token, phone_change_sent_at
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
            jsonb_build_object('full_name', 'Sophie Laurent', 'avatar_url', 'https://images.unsplash.com/photo-1640529853461-92876b30944f'),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
            false,
            false,
            '',
            null,
            '',
            null,
            '',
            '',
            null,
            '',
            0,
            '',
            null,
            null,
            '',
            '',
            null
        )
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
        VALUES (
            user1_uuid,
            'user@techcorp.fr',
            'Sophie Laurent',
            'https://images.unsplash.com/photo-1640529853461-92876b30944f'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created user: user@techcorp.fr';
    ELSE
        RAISE NOTICE 'User user@techcorp.fr already exists';
    END IF;
    
    -- Create user company roles (associate users with companies)
    IF super_admin_uuid IS NOT NULL AND company1_uuid IS NOT NULL THEN
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (super_admin_uuid, company1_uuid, 'super_admin'::public.user_role, true)
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'super_admin'::public.user_role, is_primary = true;
        RAISE NOTICE 'Associated superadmin with TechCorp Solutions';
    END IF;
    
    IF super_admin_uuid IS NOT NULL AND company2_uuid IS NOT NULL THEN
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (super_admin_uuid, company2_uuid, 'super_admin'::public.user_role, false)
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'super_admin'::public.user_role;
        RAISE NOTICE 'Associated superadmin with InnovateLab';
    END IF;
    
    IF admin1_uuid IS NOT NULL AND company1_uuid IS NOT NULL THEN
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (admin1_uuid, company1_uuid, 'administrator'::public.user_role, true)
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'administrator'::public.user_role, is_primary = true;
        RAISE NOTICE 'Associated admin with TechCorp Solutions';
    END IF;
    
    IF manager1_uuid IS NOT NULL AND company1_uuid IS NOT NULL THEN
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (manager1_uuid, company1_uuid, 'manager'::public.user_role, true)
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'manager'::public.user_role, is_primary = true;
        RAISE NOTICE 'Associated manager with TechCorp Solutions';
    END IF;
    
    IF user1_uuid IS NOT NULL AND company1_uuid IS NOT NULL THEN
        INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
        VALUES (user1_uuid, company1_uuid, 'user'::public.user_role, true)
        ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'user'::public.user_role, is_primary = true;
        RAISE NOTICE 'Associated user with TechCorp Solutions';
    END IF;
    
    -- Also associate any OTHER existing users (who signed up but have no company) with company1
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    SELECT 
        up.id,
        company1_uuid,
        'user'::public.user_role,
        true
    FROM public.user_profiles up
    LEFT JOIN public.user_company_roles ucr ON up.id = ucr.user_id
    WHERE ucr.id IS NULL
    AND up.id NOT IN (super_admin_uuid, admin1_uuid, manager1_uuid, user1_uuid)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    RAISE NOTICE 'Migration completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during migration: %', SQLERRM;
END $$;
-- Create Demo Users Using Proper Supabase Auth Methods
-- This migration uses a different approach that works with Supabase's auth system

DO $$
DECLARE
    company1_uuid UUID;
    company2_uuid UUID;
    v_user_id UUID;
BEGIN
    -- Ensure companies exist
    SELECT id INTO company1_uuid FROM public.companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    IF company1_uuid IS NULL THEN
        company1_uuid := gen_random_uuid();
        INSERT INTO public.companies (id, name, email, phone, address, city, postal_code, country, max_users, status)
        VALUES (
            company1_uuid, 'TechCorp Solutions', 'admin@techcorp.fr', '+33 1 23 45 67 89',
            '123 Avenue des Champs-Élysées', 'Paris', '75008', 'France', 25, 'active'::public.company_status
        );
    END IF;
    
    SELECT id INTO company2_uuid FROM public.companies WHERE name = 'InnovateLab' LIMIT 1;
    IF company2_uuid IS NULL THEN
        company2_uuid := gen_random_uuid();
        INSERT INTO public.companies (id, name, email, phone, address, city, postal_code, country, max_users, status)
        VALUES (
            company2_uuid, 'InnovateLab', 'contact@innovatelab.fr', '+33 4 56 78 90 12',
            '456 Rue de la République', 'Lyon', '69002', 'France', 15, 'active'::public.company_status
        );
    END IF;
    
    -- Super Admin
    v_user_id := 'a0000000-0000-0000-0000-000000000001'::UUID;
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        email_change_confirm_status, reauthentication_token, phone, phone_change, phone_change_token
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'superadmin@stockflow.fr', crypt('SuperAdmin123!', gen_salt('bf')),
        now(), now(), now(),
        '{"full_name": "Super Admin", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"}'::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        false, false, '', '', '', '', '', 0, '', null, '', ''
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (v_user_id, 'superadmin@stockflow.fr', 'Super Admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    VALUES 
        (v_user_id, company1_uuid, 'super_admin'::public.user_role, true),
        (v_user_id, company2_uuid, 'super_admin'::public.user_role, false)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    -- Admin
    v_user_id := 'a0000000-0000-0000-0000-000000000002'::UUID;
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        email_change_confirm_status, reauthentication_token, phone, phone_change, phone_change_token
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@techcorp.fr', crypt('Admin123!', gen_salt('bf')),
        now(), now(), now(),
        '{"full_name": "Marie Dubois", "avatar_url": "https://images.unsplash.com/photo-1707394315636-815658801294"}'::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        false, false, '', '', '', '', '', 0, '', null, '', ''
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (v_user_id, 'admin@techcorp.fr', 'Marie Dubois', 'https://images.unsplash.com/photo-1707394315636-815658801294')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    VALUES (v_user_id, company1_uuid, 'administrator'::public.user_role, true)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    -- Manager
    v_user_id := 'a0000000-0000-0000-0000-000000000003'::UUID;
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        email_change_confirm_status, reauthentication_token, phone, phone_change, phone_change_token
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'manager@techcorp.fr', crypt('Manager123!', gen_salt('bf')),
        now(), now(), now(),
        '{"full_name": "Pierre Martin", "avatar_url": "https://images.unsplash.com/photo-1665868727194-0e5eac640091"}'::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        false, false, '', '', '', '', '', 0, '', null, '', ''
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (v_user_id, 'manager@techcorp.fr', 'Pierre Martin', 'https://images.unsplash.com/photo-1665868727194-0e5eac640091')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    VALUES (v_user_id, company1_uuid, 'manager'::public.user_role, true)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    -- Regular User
    v_user_id := 'a0000000-0000-0000-0000-000000000004'::UUID;
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        email_change_confirm_status, reauthentication_token, phone, phone_change, phone_change_token
    ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'user@techcorp.fr', crypt('User123!', gen_salt('bf')),
        now(), now(), now(),
        '{"full_name": "Sophie Laurent", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80"}'::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        false, false, '', '', '', '', '', 0, '', null, '', ''
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (v_user_id, 'user@techcorp.fr', 'Sophie Laurent', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    VALUES (v_user_id, company1_uuid, 'user'::public.user_role, true)
    ON CONFLICT (user_id, company_id) DO NOTHING;
    
    RAISE NOTICE 'Demo users creation attempted with fixed UUIDs';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating demo users: %', SQLERRM;
        RAISE NOTICE 'This is expected if auth.users requires special permissions';
END $$;
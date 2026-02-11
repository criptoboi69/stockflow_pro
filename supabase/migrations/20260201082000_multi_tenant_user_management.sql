-- Multi-Tenant User Management System
-- Roles: super_admin, administrator, manager, user
-- Features: Multi-company support, email invitations, role-based permissions

-- 1. Create custom types
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('super_admin', 'administrator', 'manager', 'user');

DROP TYPE IF EXISTS public.invitation_status CASCADE;
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

DROP TYPE IF EXISTS public.company_status CASCADE;
CREATE TYPE public.company_status AS ENUM ('active', 'inactive', 'suspended');

-- 2. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'France',
    timezone TEXT DEFAULT 'Europe/Paris',
    max_users INTEGER DEFAULT 10,
    status public.company_status DEFAULT 'active'::public.company_status,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create user_profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create user_company_roles table (junction table for multi-company support)
CREATE TABLE IF NOT EXISTS public.user_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

-- 5. Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status public.invitation_status DEFAULT 'pending'::public.invitation_status,
    token TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_user_id ON public.user_company_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_company_id ON public.user_company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_role ON public.user_company_roles(role);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- 7. Create functions (BEFORE RLS policies)

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$;

-- Function to get user role in a company
CREATE OR REPLACE FUNCTION public.get_user_role_in_company(user_uuid UUID, company_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role::TEXT
    FROM public.user_company_roles
    WHERE user_id = user_uuid AND company_id = company_uuid
    LIMIT 1;
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'::public.user_role
    );
$$;

-- Function to check if user is admin of a company
CREATE OR REPLACE FUNCTION public.is_company_admin(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid() 
        AND company_id = company_uuid 
        AND role IN ('administrator'::public.user_role, 'super_admin'::public.user_role)
    );
$$;

-- Function to check if user can manage users in a company
CREATE OR REPLACE FUNCTION public.can_manage_users(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid() 
        AND company_id = company_uuid 
        AND role IN ('administrator'::public.user_role, 'manager'::public.user_role, 'super_admin'::public.user_role)
    );
$$;

-- Function to get user's companies
CREATE OR REPLACE FUNCTION public.get_user_companies(user_uuid UUID)
RETURNS TABLE(
    company_id UUID,
    company_name TEXT,
    role TEXT,
    is_primary BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        c.id,
        c.name,
        ucr.role::TEXT,
        ucr.is_primary
    FROM public.user_company_roles ucr
    JOIN public.companies c ON ucr.company_id = c.id
    WHERE ucr.user_id = user_uuid
    ORDER BY ucr.is_primary DESC, c.name ASC;
$$;

-- 8. Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies

-- User Profiles policies
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_view_company_members" ON public.user_profiles;
CREATE POLICY "users_view_company_members"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_company_roles ucr1
        JOIN public.user_company_roles ucr2 ON ucr1.company_id = ucr2.company_id
        WHERE ucr1.user_id = auth.uid() AND ucr2.user_id = public.user_profiles.id
    )
);

-- Companies policies
DROP POLICY IF EXISTS "super_admin_full_access_companies" ON public.companies;
CREATE POLICY "super_admin_full_access_companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "users_view_own_companies" ON public.companies;
CREATE POLICY "users_view_own_companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid() AND company_id = public.companies.id
    )
);

DROP POLICY IF EXISTS "admins_manage_own_companies" ON public.companies;
CREATE POLICY "admins_manage_own_companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.is_company_admin(id))
WITH CHECK (public.is_company_admin(id));

-- User Company Roles policies
DROP POLICY IF EXISTS "super_admin_full_access_roles" ON public.user_company_roles;
CREATE POLICY "super_admin_full_access_roles"
ON public.user_company_roles
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_company_roles;
CREATE POLICY "users_view_own_roles"
ON public.user_company_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_view_company_roles" ON public.user_company_roles;
CREATE POLICY "users_view_company_roles"
ON public.user_company_roles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_company_roles
        WHERE user_id = auth.uid() AND company_id = public.user_company_roles.company_id
    )
);

DROP POLICY IF EXISTS "admins_manage_company_roles" ON public.user_company_roles;
CREATE POLICY "admins_manage_company_roles"
ON public.user_company_roles
FOR ALL
TO authenticated
USING (public.can_manage_users(company_id))
WITH CHECK (public.can_manage_users(company_id));

-- Invitations policies
DROP POLICY IF EXISTS "users_view_own_invitations" ON public.invitations;
CREATE POLICY "users_view_own_invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "managers_create_invitations" ON public.invitations;
CREATE POLICY "managers_create_invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_users(company_id) AND invited_by = auth.uid());

DROP POLICY IF EXISTS "managers_view_company_invitations" ON public.invitations;
CREATE POLICY "managers_view_company_invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (public.can_manage_users(company_id));

DROP POLICY IF EXISTS "managers_update_invitations" ON public.invitations;
CREATE POLICY "managers_update_invitations"
ON public.invitations
FOR UPDATE
TO authenticated
USING (public.can_manage_users(company_id))
WITH CHECK (public.can_manage_users(company_id));

-- 10. Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 11. Create mock data
DO $$
DECLARE
    super_admin_uuid UUID := gen_random_uuid();
    admin1_uuid UUID := gen_random_uuid();
    manager1_uuid UUID := gen_random_uuid();
    user1_uuid UUID := gen_random_uuid();
    company1_uuid UUID := gen_random_uuid();
    company2_uuid UUID := gen_random_uuid();
BEGIN
    -- Create companies
    INSERT INTO public.companies (id, name, email, phone, address, city, postal_code, country, max_users, status)
    VALUES 
        (company1_uuid, 'TechCorp Solutions', 'admin@techcorp.fr', '+33 1 23 45 67 89', '123 Avenue des Champs-Élysées', 'Paris', '75008', 'France', 25, 'active'::public.company_status),
        (company2_uuid, 'InnovateLab', 'contact@innovatelab.fr', '+33 4 56 78 90 12', '456 Rue de la République', 'Lyon', '69002', 'France', 15, 'active'::public.company_status)
    ON CONFLICT (id) DO NOTHING;

    -- Create auth users (trigger will create user_profiles)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (super_admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'superadmin@stockflow.fr', crypt('SuperAdmin123!', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Super Admin', 'avatar_url', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (admin1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@techcorp.fr', crypt('Admin123!', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Marie Dubois', 'avatar_url', 'https://images.unsplash.com/photo-1707394315636-815658801294'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (manager1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'manager@techcorp.fr', crypt('Manager123!', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Pierre Martin', 'avatar_url', 'https://images.unsplash.com/photo-1665868727194-0e5eac640091'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'user@techcorp.fr', crypt('User123!', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Sophie Laurent', 'avatar_url', 'https://images.unsplash.com/photo-1640529853461-92876b30944f'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create user company roles
    INSERT INTO public.user_company_roles (user_id, company_id, role, is_primary)
    VALUES 
        (super_admin_uuid, company1_uuid, 'super_admin'::public.user_role, true),
        (super_admin_uuid, company2_uuid, 'super_admin'::public.user_role, false),
        (admin1_uuid, company1_uuid, 'administrator'::public.user_role, true),
        (manager1_uuid, company1_uuid, 'manager'::public.user_role, true),
        (user1_uuid, company1_uuid, 'user'::public.user_role, true)
    ON CONFLICT (user_id, company_id) DO NOTHING;

    -- Create sample invitations
    INSERT INTO public.invitations (email, company_id, role, invited_by, status, token, expires_at)
    VALUES 
        ('newuser@techcorp.fr', company1_uuid, 'user'::public.user_role, admin1_uuid, 'pending'::public.invitation_status, encode(gen_random_uuid()::text::bytea, 'base64'), now() + interval '7 days')
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
-- Audit Logs Table for tracking user actions and system events
-- Features: User actions, role changes, data modifications, system events

-- 1. Create audit action type enum
DROP TYPE IF EXISTS public.audit_action_type CASCADE;
CREATE TYPE public.audit_action_type AS ENUM (
    'user_login',
    'user_logout',
    'user_created',
    'user_updated',
    'user_deleted',
    'role_changed',
    'product_created',
    'product_updated',
    'product_deleted',
    'stock_movement_created',
    'stock_movement_updated',
    'stock_movement_deleted',
    'category_created',
    'category_updated',
    'category_deleted',
    'company_created',
    'company_updated',
    'settings_updated',
    'data_imported',
    'data_exported',
    'system_event'
);

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action_type public.audit_action_type NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- 4. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies

-- Users can view audit logs from their companies
DROP POLICY IF EXISTS "users_view_company_audit_logs" ON public.audit_logs;
CREATE POLICY "users_view_company_audit_logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- Only super_admin and administrator can insert audit logs (system-level)
DROP POLICY IF EXISTS "admins_insert_audit_logs" ON public.audit_logs;
CREATE POLICY "admins_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin'::public.user_role, 'administrator'::public.user_role)
    )
);

-- 6. Create mock audit log data
DO $$
DECLARE
    existing_company_id UUID;
    existing_user_id UUID;
    existing_product_id UUID;
BEGIN
    -- Get existing company
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'companies'
    ) THEN
        SELECT id INTO existing_company_id FROM public.companies LIMIT 1;
        
        IF existing_company_id IS NOT NULL THEN
            -- Get existing user
            SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
            
            -- Get existing product if available
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'products'
            ) THEN
                SELECT id INTO existing_product_id FROM public.products WHERE company_id = existing_company_id LIMIT 1;
            END IF;
            
            -- Create sample audit logs
            INSERT INTO public.audit_logs (company_id, user_id, action_type, entity_type, entity_id, entity_name, description, metadata)
            VALUES 
                (
                    existing_company_id,
                    existing_user_id,
                    'user_login'::public.audit_action_type,
                    'user',
                    existing_user_id,
                    'Admin User',
                    'Utilisateur connecté au système',
                    jsonb_build_object('ip_address', '192.168.1.1', 'browser', 'Chrome')
                ),
                (
                    existing_company_id,
                    existing_user_id,
                    'product_created'::public.audit_action_type,
                    'product',
                    existing_product_id,
                    'Nouveau produit',
                    'Produit créé avec succès',
                    jsonb_build_object('sku', 'PROD-001', 'quantity', 100)
                ),
                (
                    existing_company_id,
                    existing_user_id,
                    'stock_movement_created'::public.audit_action_type,
                    'stock_movement',
                    gen_random_uuid(),
                    'Réception de stock',
                    'Mouvement de stock enregistré - Réception',
                    jsonb_build_object('type', 'receipt', 'quantity', 50, 'location', 'Entrepôt A')
                ),
                (
                    existing_company_id,
                    existing_user_id,
                    'role_changed'::public.audit_action_type,
                    'user',
                    existing_user_id,
                    'John Doe',
                    'Rôle utilisateur modifié de user à manager',
                    jsonb_build_object('old_role', 'user', 'new_role', 'manager')
                ),
                (
                    existing_company_id,
                    existing_user_id,
                    'settings_updated'::public.audit_action_type,
                    'settings',
                    existing_company_id,
                    'Paramètres généraux',
                    'Paramètres de l''entreprise mis à jour',
                    jsonb_build_object('section', 'general', 'fields_updated', ARRAY['timezone', 'language'])
                ),
                (
                    existing_company_id,
                    existing_user_id,
                    'data_exported'::public.audit_action_type,
                    'export',
                    gen_random_uuid(),
                    'Export produits',
                    'Export de données effectué - Produits',
                    jsonb_build_object('format', 'CSV', 'records_count', 150)
                )
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE 'Sample audit logs created successfully';
        ELSE
            RAISE NOTICE 'No companies found. Run company migration first.';
        END IF;
    ELSE
        RAISE NOTICE 'Table companies does not exist. Run company migration first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock audit log data insertion failed: %', SQLERRM;
END $$;
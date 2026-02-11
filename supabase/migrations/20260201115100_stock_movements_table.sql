-- Create stock_movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('receipt', 'issue', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    running_balance INTEGER NOT NULL DEFAULT 0,
    location TEXT NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_id ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements(created_by);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view stock movements from their companies
DROP POLICY IF EXISTS "users_view_company_stock_movements" ON public.stock_movements;
CREATE POLICY "users_view_company_stock_movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- RLS Policy: Users can insert stock movements for their companies
DROP POLICY IF EXISTS "users_insert_company_stock_movements" ON public.stock_movements;
CREATE POLICY "users_insert_company_stock_movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- RLS Policy: Users can update stock movements from their companies
DROP POLICY IF EXISTS "users_update_company_stock_movements" ON public.stock_movements;
CREATE POLICY "users_update_company_stock_movements"
ON public.stock_movements
FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- RLS Policy: Users can delete stock movements from their companies
DROP POLICY IF EXISTS "users_delete_company_stock_movements" ON public.stock_movements;
CREATE POLICY "users_delete_company_stock_movements"
ON public.stock_movements
FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_stock_movements_updated_at ON public.stock_movements;
CREATE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update product quantity when stock movement is created
CREATE OR REPLACE FUNCTION public.update_product_quantity_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update product quantity based on movement type
    UPDATE public.products
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Update running balance with new product quantity
    UPDATE public.stock_movements
    SET running_balance = (SELECT quantity FROM public.products WHERE id = NEW.product_id)
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger to update product quantity after stock movement insert
DROP TRIGGER IF EXISTS trigger_update_product_quantity ON public.stock_movements;
CREATE TRIGGER trigger_update_product_quantity
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_quantity_on_movement();

-- Mock data for stock movements
DO $$
DECLARE
    existing_company_id UUID;
    existing_user_id UUID;
    product_1_id UUID;
    product_2_id UUID;
    product_3_id UUID;
BEGIN
    -- Get existing company and user
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'companies'
    ) THEN
        SELECT id INTO existing_company_id FROM public.companies LIMIT 1;
        SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
        
        IF existing_company_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
            -- Get some product IDs
            SELECT id INTO product_1_id FROM public.products WHERE company_id = existing_company_id LIMIT 1 OFFSET 0;
            SELECT id INTO product_2_id FROM public.products WHERE company_id = existing_company_id LIMIT 1 OFFSET 1;
            SELECT id INTO product_3_id FROM public.products WHERE company_id = existing_company_id LIMIT 1 OFFSET 2;
            
            IF product_1_id IS NOT NULL THEN
                -- Insert sample stock movements
                INSERT INTO public.stock_movements (company_id, product_id, type, quantity, location, reason, created_by, created_at)
                VALUES 
                    (existing_company_id, product_1_id, 'receipt', 25, 'warehouse_a', 'Réception commande fournisseur REF-2024-1025', existing_user_id, NOW() - INTERVAL '5 days'),
                    (existing_company_id, product_2_id, 'issue', -15, 'store_front', 'Vente client - Commande CLI-2024-0892', existing_user_id, NOW() - INTERVAL '4 days'),
                    (existing_company_id, product_3_id, 'adjustment', -3, 'warehouse_b', 'Correction inventaire - Produits endommagés lors du transport', existing_user_id, NOW() - INTERVAL '3 days'),
                    (existing_company_id, product_1_id, 'transfer', 10, 'warehouse_a', 'Transfert depuis Entrepôt B pour réapprovisionnement magasin', existing_user_id, NOW() - INTERVAL '2 days'),
                    (existing_company_id, product_2_id, 'receipt', 40, 'warehouse_b', 'Nouvelle livraison fournisseur - Commande urgente', existing_user_id, NOW() - INTERVAL '1 day')
                ON CONFLICT (id) DO NOTHING;
                
                RAISE NOTICE 'Sample stock movements created successfully';
            ELSE
                RAISE NOTICE 'No products found. Run products migration first.';
            END IF;
        ELSE
            RAISE NOTICE 'No existing company or user found. Run user management migration first.';
        END IF;
    ELSE
        RAISE NOTICE 'Table companies does not exist. Run user management migration first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;
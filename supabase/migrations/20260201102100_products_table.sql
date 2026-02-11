-- Create products table with image support
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2),
    min_stock INTEGER NOT NULL DEFAULT 10,
    image_url TEXT,
    image_file_path TEXT,
    status TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN quantity = 0 THEN 'out_of_stock'
            WHEN quantity <= min_stock THEN 'low_stock'
            ELSE 'in_stock'
        END
    ) STORED,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- Create unique constraint for SKU per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_company_sku ON public.products(company_id, sku);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view products from their companies
DROP POLICY IF EXISTS "users_view_company_products" ON public.products;
CREATE POLICY "users_view_company_products"
ON public.products
FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- RLS Policy: Users can insert products for their companies
DROP POLICY IF EXISTS "users_insert_company_products" ON public.products;
CREATE POLICY "users_insert_company_products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- RLS Policy: Users can update products from their companies
DROP POLICY IF EXISTS "users_update_company_products" ON public.products;
CREATE POLICY "users_update_company_products"
ON public.products
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

-- RLS Policy: Users can delete products from their companies
DROP POLICY IF EXISTS "users_delete_company_products" ON public.products;
CREATE POLICY "users_delete_company_products"
ON public.products
FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
    )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Mock data for products
DO $$
DECLARE
    existing_company_id UUID;
    existing_user_id UUID;
BEGIN
    -- Get existing company and user
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'companies'
    ) THEN
        SELECT id INTO existing_company_id FROM public.companies LIMIT 1;
        SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
        
        IF existing_company_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
            -- Insert sample products
            INSERT INTO public.products (company_id, name, sku, description, category, location, quantity, price, min_stock, image_url, created_by)
            VALUES 
                (existing_company_id, 'MacBook Pro 16 pouces', 'MBP-16-2023-001', 'Ordinateur portable professionnel avec puce M2 Pro, 16 Go RAM, 512 Go SSD', 'electronics', 'warehouse_a', 15, 2499.00, 5, 'https://images.unsplash.com/photo-1644659306528-259903deccde', existing_user_id),
                (existing_company_id, 'iPhone 15 Pro Max', 'IPH-15PM-256-TIT', 'Smartphone premium avec écran 6.7 pouces, 256 Go, Titane naturel', 'electronics', 'store_front', 8, 1479.00, 10, 'https://images.unsplash.com/photo-1592161076259-b78c6ca60063', existing_user_id),
                (existing_company_id, 'Chemise Oxford Blanche', 'CHM-OXF-WHT-L', 'Chemise classique en coton Oxford, coupe droite, taille L', 'clothing', 'warehouse_b', 0, 89.90, 20, 'https://images.unsplash.com/photo-1711355249709-1733df63e028', existing_user_id),
                (existing_company_id, 'Le Petit Prince - Antoine de Saint-Exupéry', 'LIV-PPR-FR-001', 'Édition classique du célèbre conte philosophique français', 'books', 'storage_room', 45, 12.50, 15, 'https://images.unsplash.com/photo-1662920390970-512b5279ad27', existing_user_id),
                (existing_company_id, 'Plante Monstera Deliciosa', 'PLT-MON-DEL-M', 'Plante d''intérieur tropicale, pot de 20cm, hauteur 60cm', 'home_garden', 'store_front', 12, 34.99, 8, 'https://images.unsplash.com/photo-1628620223412-ad52eef8c4de', existing_user_id),
                (existing_company_id, 'Raquette de Tennis Wilson Pro Staff', 'RAQ-WIL-PS-97', 'Raquette professionnelle, poids 315g, tamis 97 pouces²', 'sports', 'warehouse_a', 6, 189.00, 10, 'https://images.unsplash.com/photo-1688476362188-83f3d9652c98', existing_user_id),
                (existing_company_id, 'Crème Hydratante Visage Bio', 'COS-HYD-BIO-50', 'Soin hydratant quotidien, formule bio certifiée, 50ml', 'beauty', 'warehouse_b', 28, 24.90, 15, 'https://images.unsplash.com/photo-1702312685548-3832748d09d6', existing_user_id),
                (existing_company_id, 'Casque Audio Sony WH-1000XM5', 'CAS-SON-XM5-BLK', 'Casque sans fil à réduction de bruit active, autonomie 30h', 'electronics', 'store_front', 3, 399.00, 8, 'https://images.unsplash.com/photo-1599855129460-58c62b60e3df', existing_user_id)
            ON CONFLICT (company_id, sku) DO NOTHING;
            
            RAISE NOTICE 'Sample products created successfully';
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
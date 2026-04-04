-- =============================================================================
-- COMPANIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    vat_number TEXT,
    status TEXT DEFAULT 'active',
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USER PROFILES TABLE  
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,  -- Links to auth.users
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'manager', 'employee')),
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USER COMPANY ROLES TABLE (Multi-tenant)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_company_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'admin', 'manager', 'employee')),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

ALTER TABLE user_company_roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    category TEXT,
    product_location TEXT,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    min_stock INTEGER DEFAULT 5,
    status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    barcode TEXT,
    qr_code TEXT,
    image_url TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- LOCATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    type TEXT DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'showroom', 'workshop', 'truck', 'external')),
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STOCK MOVEMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    type TEXT NOT NULL CHECK (type IN ('receipt', 'shipment', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (Basic - for demo)
-- =============================================================================

-- Companies: All users can read, only admins can write
CREATE POLICY "companies_read" ON companies FOR SELECT USING (true);
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (true);
CREATE POLICY "companies_delete" ON companies FOR DELETE USING (true);

-- Products: All users can read, only admins can write
CREATE POLICY "products_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true);
CREATE POLICY "products_delete" ON products FOR DELETE USING (true);

-- Categories: All users can read, only admins can write
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (true);

-- Locations: All users can read, only admins can write
CREATE POLICY "locations_read" ON locations FOR SELECT USING (true);
CREATE POLICY "locations_insert" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "locations_update" ON locations FOR UPDATE USING (true);
CREATE POLICY "locations_delete" ON locations FOR DELETE USING (true);

-- User profiles: Users can read their own, admins can read all
CREATE POLICY "user_profiles_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (true);

-- User company roles: Users can read their own
CREATE POLICY "user_company_roles_read" ON user_company_roles FOR SELECT USING (true);
CREATE POLICY "user_company_roles_insert" ON user_company_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_company_roles_update" ON user_company_roles FOR UPDATE USING (true);

-- Stock movements: All users can read, only admins can write
CREATE POLICY "stock_movements_read" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "stock_movements_update" ON stock_movements FOR UPDATE USING (true);

-- Audit logs: All users can read, only admins can write
CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);

-- =============================================================================
-- DEMO DATA
-- =============================================================================

-- Demo Company
INSERT INTO companies (id, name, email, phone, address, vat_number, status) VALUES 
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Vizion Windows', 'contact@vizionwindows.be', '+32 2 123 45 67', 'Rue de l Industrie 123, Bruxelles', 'BE0123.456.789', 'active')
ON CONFLICT (id) DO NOTHING;

-- Demo Users
INSERT INTO user_profiles (id, email, full_name, phone, role, is_active) VALUES 
('a1000000-0000-0000-0000-000000000001', 'superadmin@demo.com', 'Super Administrateur', '+32 4 70 00 00 01', 'super_admin', true),
('a1000000-0000-0000-0000-000000000002', 'admin@demo.com', 'Administrateur', '+32 4 70 00 00 02', 'admin', true),
('a1000000-0000-0000-0000-000000000003', 'manager@demo.com', 'Gerant', '+32 4 70 00 00 03', 'manager', true),
('a1000000-0000-0000-0000-000000000004', 'user@demo.com', 'Employe', '+32 4 70 00 00 04', 'employee', true)
ON CONFLICT (id) DO NOTHING;

-- Demo User-Company Roles
INSERT INTO user_company_roles (user_id, company_id, role, is_primary) VALUES 
('a1000000-0000-0000-0000-000000000001', '1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'super_admin', true),
('a1000000-0000-0000-0000-000000000002', '1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'admin', true),
('a1000000-0000-0000-0000-000000000003', '1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'manager', true),
('a1000000-0000-0000-0000-000000000004', '1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'employee', true)
ON CONFLICT DO NOTHING;

-- Demo Categories
INSERT INTO categories (company_id, name, description, color) VALUES 
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Fenetres', 'Fenetres en aluminium et PVC', '#3b82f6'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Portes', 'Portes entree et interieures', '#10b981'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Chassis', 'Chassis de fenetre', '#f59e0b'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Volets', 'Volets roulants et battants', '#8b5cf6'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Vitrage', 'Vitrages et glazing', '#06b6d4'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Stores', 'Stores exterieur et interieur', '#ec4899')
ON CONFLICT DO NOTHING;

-- Demo Locations
INSERT INTO locations (company_id, name, address, type, capacity) VALUES 
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Entrepot Principal', 'Rue de l Industrie 123, Bruxelles', 'warehouse', 1000),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Atelier', 'Rue de Atelier 45, Bruxelles', 'workshop', 200),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Showroom', 'Avenue du Commerce 78, Bruxelles', 'showroom', 50),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Camion 1', 'Vehicule utilitaire', 'truck', 30),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Camion 2', 'Vehicule utilitaire', 'truck', 30)
ON CONFLICT DO NOTHING;

-- Demo Products
INSERT INTO products (company_id, name, sku, category, product_location, quantity, price, min_stock, status, barcode, qr_code) VALUES 
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Fenetre ALU coulissante 2 vantaux', 'FEN-ALU-001', 'Fenetres', 'Entrepot Principal', 45, 890, 10, 'in_stock', '123456789001', 'FEN-ALU-001-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Fenetre PVC oscillo-battante', 'FEN-PVC-002', 'Fenetres', 'Entrepot Principal', 28, 450, 10, 'in_stock', '123456789002', 'FEN-PVC-002-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Porte entree blindee', 'POR-BLI-001', 'Portes', 'Showroom', 12, 1250, 5, 'in_stock', '223456789001', 'POR-BLI-001-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Porte coulissante ALU', 'POR-COU-001', 'Portes', 'Entrepot Principal', 6, 1450, 5, 'low_stock', '223456789002', 'POR-COU-001-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Volet roulant electrique', 'VOL-ELE-001', 'Volets', 'Entrepot Principal', 35, 420, 15, 'in_stock', '323456789001', 'VOL-ELE-001-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Vitrage double 4/16/4', 'VIT-DOB-001', 'Vitrage', 'Entrepot Principal', 150, 65, 50, 'in_stock', '423456789001', 'VIT-DOB-001-QR'),
('1b1d0863-cc82-4e2f-89e8-03788e871fb1', 'Store banne motorise', 'STO-BAN-001', 'Stores', 'Showroom', 8, 680, 3, 'in_stock', '523456789001', 'STO-BAN-001-QR')
ON CONFLICT DO NOTHING;

SELECT 'Database setup complete!' as status;

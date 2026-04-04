CREATE TABLE IF NOT EXISTS admin_console_ops_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('queue', 'workboard')),
    item_key TEXT NOT NULL,
    status TEXT,
    owner TEXT,
    note TEXT,
    updated_by UUID REFERENCES user_profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, scope, item_key)
);

ALTER TABLE admin_console_ops_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_console_ops_state_read" ON admin_console_ops_state
FOR SELECT USING (true);

CREATE POLICY "admin_console_ops_state_insert" ON admin_console_ops_state
FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_console_ops_state_update" ON admin_console_ops_state
FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_admin_console_ops_state_company_scope
ON admin_console_ops_state(company_id, scope);

import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Admin client with service role key (bypass RLS)
const getAdminClient = () => {
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  // Note: Must use VITE_ prefix for client-side exposure
  const serviceRoleKey = import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Admin client: No service role key, using regular client');
    return supabase; // Fallback to regular client
  }
  
  console.info('Admin client: Using service role key (bypass RLS)');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

class AdminConsoleService {
  async getGlobalKPIs() {
    const [companiesRes, profilesRes, productsRes, locationsRes, movementsRes] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id,is_active', { count: 'exact' }),
      supabase.from('products').select('id,quantity,price,min_stock,status,company_id'),
      supabase.from('locations').select('id', { count: 'exact', head: true }),
      supabase.from('stock_movements').select('id', { count: 'exact', head: true })
    ]);

    const products = productsRes.data || [];
    const users = profilesRes.data || [];

    return {
      companies: companiesRes.count || 0,
      users: users.length,
      activeUsers: users.filter((u) => u?.is_active !== false).length,
      products: products.length,
      locations: locationsRes.count || 0,
      stockMovements: movementsRes.count || 0,
      stockQuantity: products.reduce((sum, p) => sum + Number(p?.quantity || 0), 0),
      stockValue: products.reduce((sum, p) => sum + Number(p?.quantity || 0) * Number(p?.price || 0), 0),
      lowStock: products.filter((p) => Number(p?.quantity || 0) <= Number(p?.min_stock || 0) && Number(p?.quantity || 0) > 0).length,
      outOfStock: products.filter((p) => Number(p?.quantity || 0) <= 0 || p?.status === 'out_of_stock').length,
    };
  }

  async getCompaniesOverview() {
    logger.info('getCompaniesOverview: Starting...');
    // Use admin client to bypass RLS
    const adminSupabase = getAdminClient();
    const [companiesRes, usersRes, productsRes, locationsRes, auditRes] = await Promise.all([
      adminSupabase.from('companies').select('id,name,status,created_at,updated_at'),
      adminSupabase.from('user_company_roles').select('company_id,user_id,role,is_active'),
      adminSupabase.from('products').select('company_id,quantity,price,min_stock,status'),
      adminSupabase.from('locations').select('company_id,id'),
      adminSupabase.from('audit_logs').select('company_id,created_at').order('created_at', { ascending: false })
    ]);

    const companies = companiesRes.data || [];
    logger.info('getCompaniesOverview: Raw companies:', companies?.length, companies);
    const users = usersRes.data || [];
    const products = productsRes.data || [];
    const locations = locationsRes.data || [];
    const audits = auditRes.data || [];

    logger.info('getCompaniesOverview: Processing companies...');
    return companies.map((company) => {
      const companyUsers = users.filter((u) => u.company_id === company.id && u.is_active !== false);
      const companyProducts = products.filter((p) => p.company_id === company.id);
      const companyLocations = locations.filter((l) => l.company_id === company.id);
      const lastActivity = audits.find((a) => a.company_id === company.id)?.created_at || null;

      return {
        id: company.id,
        name: company.name,
        status: company.status || 'inactive',
        created_at: company.created_at,
        updated_at: company.updated_at,
        users: companyUsers.length,
        admins: companyUsers.filter((u) => ['super_admin', 'admin', 'administrator'].includes(String(u.role))).length,
        products: companyProducts.length,
        locations: companyLocations.length,
        stockValue: companyProducts.reduce((sum, p) => sum + Number(p?.quantity || 0) * Number(p?.price || 0), 0),
        lowStock: companyProducts.filter((p) => Number(p?.quantity || 0) <= Number(p?.min_stock || 0) && Number(p?.quantity || 0) > 0).length,
        outOfStock: companyProducts.filter((p) => Number(p?.quantity || 0) <= 0 || p?.status === 'out_of_stock').length,
        lastActivity,
      };
    });
  }

  async getCompaniesRaw() {
    // Use admin client to bypass RLS
    const adminSupabase = getAdminClient();
    const { data, error } = await adminSupabase.from('companies').select('*');
    if (error) {
      logger.error('getCompaniesRaw error:', error);
      return [];
    }
    logger.info('getCompaniesRaw:', data?.length, data);
    return data || [];
  }

  async createCompany(name) {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        status: 'active',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      logger.error('Create company error:', error);
      throw error;
    }
    logger.info('Company created:', data);
    return data;
  }

  async getRecentActivity(limit = 20) {
    const { data } = await supabase
      .from('audit_logs')
      .select('id,company_id,table_name,action,created_at,created_by,new_values')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getDashboardStats() {
    const kpis = await this.getGlobalKPIs();
    const companies = await this.getCompaniesOverview();
    const alerts = await this.getAlerts();
    
    return {
      companies: kpis.companies,
      users: kpis.users,
      activeOps: 0,
      alerts: alerts.length
    };
  }

  async addUserToCompany(userId, companyId, role) {
    const { error } = await supabase
      .from('user_company_roles')
      .insert({
        user_id: userId,
        company_id: companyId,
        role,
        is_active: true
      });
    
    if (error) throw error;
    return { success: true };
  }

  async runDataQualityChecks() {
    const checks = [];
    const summary = { pass: 0, warning: 0, error: 0 };
    
    // Check 1: Companies without admin
    const companies = await this.getCompaniesOverview();
    const companiesWithoutAdmin = companies.filter(c => c.admins === 0);
    checks.push({
      name: 'Entreprises sans administrateur',
      description: 'Chaque entreprise doit avoir au moins un administrateur',
      status: companiesWithoutAdmin.length > 0 ? 'error' : 'pass',
      affectedCount: companiesWithoutAdmin.length,
      details: companiesWithoutAdmin.length > 0 
        ? `${companiesWithoutAdmin.map(c => c.name).join(', ')}` 
        : 'Toutes les entreprises ont un administrateur'
    });
    summary[companiesWithoutAdmin.length > 0 ? 'error' : 'pass']++;
    
    // Check 2: Products without image
    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url, company_id')
      .is('image_url', null)
      .limit(100);
    checks.push({
      name: 'Produits sans image',
      description: 'Les produits devraient avoir au moins une image',
      status: (products?.length || 0) > 0 ? 'warning' : 'pass',
      affectedCount: products?.length || 0,
      details: products?.length > 0 ? `${products.length} produits sans image` : 'Tous les produits ont une image'
    });
    summary[(products?.length || 0) > 0 ? 'warning' : 'pass']++;
    
    // Check 3: Low stock products
    const lowStockProducts = companies.reduce((sum, c) => sum + (c.lowStock || 0), 0);
    checks.push({
      name: 'Stocks faibles',
      description: 'Produits en dessous du seuil minimum',
      status: lowStockProducts > 10 ? 'error' : lowStockProducts > 0 ? 'warning' : 'pass',
      affectedCount: lowStockProducts,
      details: lowStockProducts > 0 ? `${lowStockProducts} produits en stock faible` : 'Tous les stocks sont OK'
    });
    summary[lowStockProducts > 10 ? 'error' : lowStockProducts > 0 ? 'warning' : 'pass']++;
    
    // Check 4: Inactive users > 90 days
    const { data: inactiveUsers } = await supabase
      .from('user_profiles')
      .select('id, email, updated_at')
      .is('is_active', false)
      .limit(100);
    checks.push({
      name: 'Utilisateurs inactifs',
      description: 'Utilisateurs désactivés ou sans activité récente',
      status: (inactiveUsers?.length || 0) > 0 ? 'warning' : 'pass',
      affectedCount: inactiveUsers?.length || 0,
      details: inactiveUsers?.length > 0 ? `${inactiveUsers.length} utilisateurs inactifs` : 'Aucun utilisateur inactif'
    });
    summary[(inactiveUsers?.length || 0) > 0 ? 'warning' : 'pass']++;
    
    return { checks, summary };
  }

  async getActivityLog(limit = 100) {
    const { data } = await supabase
      .from('audit_logs')
      .select('id, company_id, table_name, action, created_at, created_by, new_values, old_values')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const activities = data || [];
    const companyIds = [...new Set(activities.map(a => a.company_id))];
    
    let companies = [];
    if (companyIds.length) {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      companies = companiesData || [];
    }
    
    return activities.map(act => ({
      ...act,
      company_name: companies.find(c => c.id === act.company_id)?.name,
      description: act.new_values ? JSON.stringify(act.new_values).slice(0, 100) : null
    }));
  }

  async getOperationsQueue() {
    const { data } = await supabase
      .from('data_operations')
      .select('id, type, status, company_id, created_by, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(50);
    
    const operations = data || [];
    const companyIds = [...new Set(operations.map(o => o.company_id))];
    
    let companies = [];
    if (companyIds.length) {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      companies = companiesData || [];
    }
    
    return operations.map(op => ({
      ...op,
      company_name: companies.find(c => c.id === op.company_id)?.name,
      progress: op.metadata?.progress || (op.status === 'completed' ? 100 : 0)
    }));
  }

  async removeUserFromCompany(userId, companyId) {
    const { error } = await supabase
      .from('user_company_roles')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);
    
    if (error) throw error;
    return { success: true };
  }

  async updateCompanyStatus(companyId, status) {
    try {
      // Validate status value (must match enum)
      const validStatuses = ['active', 'inactive', 'suspended'];
      const normalizedStatus = validStatuses.includes(status) ? status : 'inactive';
      
      logger.info(`Updating company ${companyId} status to: ${normalizedStatus}`);
      
      // First, try to read current status
      const { data: currentData, error: readError } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('id', companyId)
        .single();
      
      if (readError) {
        logger.error('Read company error:', readError);
        // Fallback: try is_active
        const isActive = normalizedStatus === 'active';
        const { error: updateError } = await supabase
          .from('companies')
          .update({ is_active: isActive, status: normalizedStatus })
          .eq('id', companyId);
        if (updateError) throw updateError;
        return { success: true };
      }
      
      logger.info(`Current company status: ${currentData?.status}`);
      
      // Update with both status and is_active for compatibility
      const { error } = await supabase
        .from('companies')
        .update({ 
          status: normalizedStatus,
          is_active: normalizedStatus === 'active'
        })
        .eq('id', companyId);
      
      if (error) {
        logger.error('Update company status error:', error);
        throw error;
      }
      
      // Verify update
      const { data: updatedData } = await supabase
        .from('companies')
        .select('status')
        .eq('id', companyId)
        .single();
      
      logger.info(`Updated company status: ${updatedData?.status}`);
      return { success: true };
    } catch (error) {
      logger.error('updateCompanyStatus failed:', error);
      throw error;
    }
  }

  async getAlerts() {
    const alerts = [];
    const companies = await this.getCompaniesOverview();
    
    // Companies without admin
    const companiesWithoutAdmin = companies.filter(c => c.admins === 0);
    if (companiesWithoutAdmin.length > 0) {
      alerts.push({
        icon: 'Building2',
        title: `${companiesWithoutAdmin.length} entreprise(s) sans administrateur`,
        description: 'Configurez au moins un admin pour chaque société',
        severity: 'warning',
        link: '/admin-console/companies'
      });
    }
    
    // Companies inactive
    const inactiveCompanies = companies.filter(c => c.status === 'inactive');
    if (inactiveCompanies.length > 0) {
      alerts.push({
        icon: 'Building2',
        title: `${inactiveCompanies.length} entreprise(s) inactive(s)`,
        description: 'Réactivez ou archivez ces sociétés',
        severity: 'warning',
        link: '/admin-console/companies'
      });
    }
    
    // Low stock across all companies
    const totalLowStock = companies.reduce((sum, c) => sum + (c.lowStock || 0), 0);
    if (totalLowStock > 0) {
      alerts.push({
        icon: 'AlertTriangle',
        title: `${totalLowStock} produit(s) en stock faible`,
        description: 'Vérifiez les approvisionnements',
        severity: 'error',
        link: '/admin-console/data-quality'
      });
    }
    
    return alerts;
  }

  async getAllUsers() {
    const { data } = await supabase.from('user_profiles').select('id,email,full_name,phone,is_active,role,created_at');
    return data || [];
  }

  async getAllUserCompanyRoles() {
    const [rolesRes, companiesRes] = await Promise.all([
      supabase.from('user_company_roles').select('user_id,company_id,role,is_active'),
      supabase.from('companies').select('id,name')
    ]);
    
    const roles = rolesRes.data || [];
    const companies = companiesRes.data || [];
    
    return roles.map(r => ({
      ...r,
      company_name: companies.find(c => c.id === r.company_id)?.name
    }));
  }

  async getCompanyDetail(companyId) {
    const [companyRes, usersRes, productsRes, locationsRes, activityRes] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('user_company_roles').select('user_id,role,is_active').eq('company_id', companyId),
      supabase.from('products').select('id,name,sku,quantity,price,min_stock,status,image_url,image_urls,category,location').eq('company_id', companyId),
      supabase.from('locations').select('*').eq('company_id', companyId),
      supabase.from('audit_logs').select('id,table_name,action,created_at,created_by').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20)
    ]);

    const company = companyRes.data;
    const roles = usersRes.data || [];
    const products = productsRes.data || [];
    const locations = locationsRes.data || [];
    const activity = activityRes.data || [];

    const userIds = [...new Set(roles.map((r) => r.user_id).filter(Boolean))];
    let profiles = [];
    if (userIds.length) {
      const { data } = await supabase.from('user_profiles').select('id,email,full_name,phone,is_active,role').in('id', userIds);
      profiles = data || [];
    }

    const users = roles.map((r) => {
      const profile = profiles.find((p) => p.id === r.user_id);
      return {
        id: r.user_id,
        role: r.role,
        membershipActive: r.is_active,
        full_name: profile?.full_name,
        email: profile?.email,
        phone: profile?.phone,
        is_active: profile?.is_active,
      };
    });

    return {
      company,
      users,
      products,
      locations,
      activity,
      stats: {
        users: users.length,
        admins: users.filter((u) => ['super_admin','admin','administrator'].includes(String(u.role))).length,
        products: products.length,
        locations: locations.length,
        stockValue: products.reduce((sum, p) => sum + Number(p?.quantity || 0) * Number(p?.price || 0), 0),
        stockLow: products.filter((p) => Number(p?.quantity || 0) <= Number(p?.min_stock || 0) && Number(p?.quantity || 0) > 0).length,
        outOfStock: products.filter((p) => Number(p?.quantity || 0) <= 0 || p?.status === 'out_of_stock').length,
      }
    };
  }

  async getSystemHealth() {
    const [productsRes, companiesRes, rolesRes] = await Promise.all([
      supabase.from('products').select('id,name,sku,category,location,image_url,image_urls'),
      supabase.from('companies').select('id,name'),
      supabase.from('user_company_roles').select('company_id,role,is_active')
    ]);

    const products = productsRes.data || [];
    const companies = companiesRes.data || [];
    const roles = rolesRes.data || [];

    return {
      productsWithoutCategory: products.filter((p) => !p?.category).length,
      productsWithoutLocation: products.filter((p) => !p?.location).length,
      productsWithoutPhoto: products.filter((p) => !(p?.image_url || (Array.isArray(p?.image_urls) && p.image_urls.length))).length,
      companiesWithoutAdmin: companies.filter((c) => !roles.some((r) => r.company_id === c.id && r.is_active !== false && ['super_admin', 'admin', 'administrator'].includes(String(r.role)))).length,
    };
  }
}

export default new AdminConsoleService();

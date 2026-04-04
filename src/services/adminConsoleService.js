import { supabase } from '../lib/supabase';

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
    const [companiesRes, usersRes, productsRes, locationsRes, auditRes] = await Promise.all([
      supabase.from('companies').select('id,name,created_at'),
      supabase.from('user_company_roles').select('company_id,user_id,role,is_active'),
      supabase.from('products').select('company_id,quantity,price,min_stock,status'),
      supabase.from('locations').select('company_id,id'),
      supabase.from('audit_logs').select('company_id,created_at').order('created_at', { ascending: false })
    ]);

    const companies = companiesRes.data || [];
    const users = usersRes.data || [];
    const products = productsRes.data || [];
    const locations = locationsRes.data || [];
    const audits = auditRes.data || [];

    return companies.map((company) => {
      const companyUsers = users.filter((u) => u.company_id === company.id && u.is_active !== false);
      const companyProducts = products.filter((p) => p.company_id === company.id);
      const companyLocations = locations.filter((l) => l.company_id === company.id);
      const lastActivity = audits.find((a) => a.company_id === company.id)?.created_at || null;

      return {
        id: company.id,
        name: company.name,
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

  async getRecentActivity(limit = 20) {
    const { data } = await supabase
      .from('audit_logs')
      .select('id,company_id,table_name,action,created_at,created_by,new_values')
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
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

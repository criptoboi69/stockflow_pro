export const fmtCurrency = (n) => new Intl.NumberFormat('fr-BE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

export const fmtDate = (d) => d ? new Date(d).toLocaleString('fr-BE') : '—';

export const fmtRelativeDate = (d) => {
  if (!d) return 'Aucune activité';
  const diffMs = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
};

export const buildHealthItems = (health) => ([
  { label: 'Produits sans catégorie', value: health?.productsWithoutCategory || 0, tone: 'warning' },
  { label: 'Produits sans emplacement', value: health?.productsWithoutLocation || 0, tone: 'warning' },
  { label: 'Produits sans photo', value: health?.productsWithoutPhoto || 0, tone: 'accent' },
  { label: 'Sociétés sans admin', value: health?.companiesWithoutAdmin || 0, tone: 'danger' },
]);

export const buildFilteredKpis = ({ filteredCompanies, filteredActivity, kpis }) => {
  const baseCompanies = filteredCompanies;
  return {
    companies: baseCompanies.length,
    users: baseCompanies.reduce((sum, company) => sum + Number(company.users || 0), 0),
    activeUsers: baseCompanies.reduce((sum, company) => sum + Number(company.users || 0), 0),
    products: baseCompanies.reduce((sum, company) => sum + Number(company.products || 0), 0),
    locations: baseCompanies.reduce((sum, company) => sum + Number(company.locations || 0), 0),
    stockValue: baseCompanies.reduce((sum, company) => sum + Number(company.stockValue || 0), 0),
    lowStock: baseCompanies.reduce((sum, company) => sum + Number(company.lowStock || 0), 0),
    outOfStock: baseCompanies.reduce((sum, company) => sum + Number(company.outOfStock || 0), 0),
    stockMovements: filteredActivity.filter((item) => String(item.table_name || '').toLowerCase().includes('stock')).length,
    stockQuantity: kpis?.stockQuantity || 0,
  };
};

export const buildUserOverview = (filteredCompanies) => {
  const rows = filteredCompanies.map((company) => ({
    id: company.id,
    name: company.name,
    users: Number(company.users || 0),
    admins: Number(company.admins || 0),
    nonAdmins: Math.max(Number(company.users || 0) - Number(company.admins || 0), 0),
    lastActivity: company.lastActivity,
    risk: Number(company.admins || 0) === 0 ? 'danger' : Number(company.users || 0) <= 1 ? 'warning' : 'success',
  }));

  return {
    totalUsers: rows.reduce((sum, row) => sum + row.users, 0),
    totalAdmins: rows.reduce((sum, row) => sum + row.admins, 0),
    companiesWithoutAdmin: rows.filter((row) => row.admins === 0).length,
    smallTeams: rows.filter((row) => row.users <= 1).length,
    rows: rows.sort((a, b) => b.users - a.users).slice(0, 6),
  };
};

export const buildPrioritizedCompanies = (filteredCompanies) => {
  return [...filteredCompanies]
    .map((company) => {
      const missingAdmins = Number(company.admins || 0) === 0;
      const lowStock = Number(company.lowStock || 0);
      const outOfStock = Number(company.outOfStock || 0);
      const inactiveDays = company.lastActivity ? Math.floor((Date.now() - new Date(company.lastActivity).getTime()) / (1000 * 60 * 60 * 24)) : null;

      const score =
        (missingAdmins ? 100 : 0) +
        outOfStock * 15 +
        lowStock * 5 +
        (inactiveDays !== null && inactiveDays >= 14 ? 20 : inactiveDays !== null && inactiveDays >= 7 ? 10 : 0);

      let tone = 'success';
      let label = 'Sous contrôle';

      if (score >= 100) {
        tone = 'danger';
        label = 'Critique';
      } else if (score >= 35) {
        tone = 'warning';
        label = 'À surveiller';
      } else if (score > 0) {
        tone = 'accent';
        label = 'Attention';
      }

      const reasons = [
        missingAdmins ? 'aucun admin' : null,
        outOfStock > 0 ? `${outOfStock} rupture(s)` : null,
        lowStock > 0 ? `${lowStock} stock(s) faible(s)` : null,
        inactiveDays !== null && inactiveDays >= 7 ? `activité faible (${inactiveDays}j)` : null,
      ].filter(Boolean);

      return { ...company, riskScore: score, riskTone: tone, riskLabel: label, riskReasons: reasons, inactiveDays };
    })
    .sort((a, b) => b.riskScore - a.riskScore || Number(b?.stockValue || 0) - Number(a?.stockValue || 0))
    .slice(0, 6);
};

export const buildPrioritySummary = (prioritizedCompanies) => ({
  critical: prioritizedCompanies.filter((company) => company.riskTone === 'danger').length,
  warning: prioritizedCompanies.filter((company) => company.riskTone === 'warning').length,
  attention: prioritizedCompanies.filter((company) => company.riskTone === 'accent').length,
});

export const buildCompanyHealthSummary = (detail) => {
  if (!detail) return [];
  return [
    { label: 'Stock faible', value: detail.stats.stockLow, tone: 'warning' },
    { label: 'Ruptures', value: detail.stats.outOfStock, tone: 'danger' },
    { label: 'Produits sans photo', value: detail.products.filter((p) => !(p?.image_url || (Array.isArray(p?.image_urls) && p.image_urls.length))).length, tone: 'accent' },
    { label: 'Produits sans emplacement', value: detail.products.filter((p) => !p?.location).length, tone: 'warning' },
  ];
};

export const buildGovernanceSummary = (detail) => {
  if (!detail) return null;
  const activeUsers = detail.users.filter((u) => u?.is_active !== false).length;
  const inactiveUsers = detail.users.filter((u) => u?.is_active === false).length;
  const admins = detail.users.filter((u) => ['super_admin', 'admin', 'administrator'].includes(String(u.role))).length;
  const managers = detail.users.filter((u) => String(u.role) === 'manager').length;
  const employees = detail.users.filter((u) => ['employee', 'user'].includes(String(u.role))).length;
  const missingNames = detail.users.filter((u) => !u?.full_name).length;
  return { activeUsers, inactiveUsers, admins, managers, employees, missingNames };
};

export const buildCompanyAnomalies = (detail, governance) => {
  if (!detail) return [];
  const items = [];

  detail.products.forEach((product) => {
    if (!product?.category) items.push({ type: 'Produit sans catégorie', severity: 'warning', label: product?.name || 'Produit', meta: product?.sku || '—' });
    if (!product?.location) items.push({ type: 'Produit sans emplacement', severity: 'warning', label: product?.name || 'Produit', meta: product?.sku || '—' });
    if (!(product?.image_url || (Array.isArray(product?.image_urls) && product.image_urls.length))) items.push({ type: 'Produit sans photo', severity: 'accent', label: product?.name || 'Produit', meta: product?.sku || '—' });
    if (Number(product?.quantity || 0) <= 0) items.push({ type: 'Rupture de stock', severity: 'danger', label: product?.name || 'Produit', meta: product?.sku || '—' });
  });

  detail.users.forEach((user) => {
    if (!user?.full_name) items.push({ type: 'Utilisateur sans nom', severity: 'warning', label: user?.email || 'Utilisateur', meta: user?.role || '—' });
    if (user?.is_active === false) items.push({ type: 'Utilisateur inactif', severity: 'neutral', label: user?.email || 'Utilisateur', meta: user?.role || '—' });
  });

  if ((governance?.admins || 0) === 0) {
    items.push({ type: 'Société sans admin', severity: 'danger', label: detail.company?.name || 'Société', meta: 'Aucun admin détecté' });
  }

  return items;
};

export const buildAnomalySummary = (anomalies) => ({
  critical: anomalies.filter((item) => item.severity === 'danger').length,
  warning: anomalies.filter((item) => item.severity === 'warning').length,
  data: anomalies.filter((item) => item.severity === 'accent').length,
});

export const buildUrgentActions = ({ detail, governance, healthSummary }) => {
  if (!detail) return [];
  const actions = [];

  if ((governance?.admins || 0) === 0) {
    actions.push({
      title: 'Ajouter un admin société',
      description: 'Aucun administrateur actif détecté sur cette société.',
      tone: 'danger',
    });
  }

  if ((detail.stats.outOfStock || 0) > 0) {
    actions.push({
      title: 'Traiter les ruptures de stock',
      description: `${detail.stats.outOfStock} produit(s) sont actuellement en rupture.`,
      tone: 'warning',
    });
  }

  if ((healthSummary[2]?.value || 0) > 0 || (healthSummary[3]?.value || 0) > 0) {
    actions.push({
      title: 'Corriger la qualité catalogue',
      description: `${healthSummary[2]?.value || 0} sans photo • ${healthSummary[3]?.value || 0} sans emplacement.`,
      tone: 'accent',
    });
  }

  if ((governance?.inactiveUsers || 0) > 0) {
    actions.push({
      title: 'Revoir les accès inactifs',
      description: `${governance.inactiveUsers} utilisateur(s) inactif(s) encore rattaché(s).`,
      tone: 'neutral',
    });
  }

  return actions.slice(0, 4);
};

export const buildActivityFeed = (detail, activityMeta) => {
  if (!detail) return [];
  return detail.activity.slice(0, 8).map((item) => ({
    ...item,
    meta: activityMeta(item),
  }));
};

export const buildOpsQueue = (prioritizedCompanies) => (
  prioritizedCompanies.map((company) => ({
    id: company.id,
    companyId: company.id,
    companyName: company.name,
    lane: company.riskTone === 'danger' ? 'governance' : company.outOfStock > 0 ? 'restock' : 'overview',
    status: company.riskTone === 'danger' ? 'à traiter' : company.riskTone === 'warning' ? 'en surveillance' : 'monitoring',
    owner: company.admins === 0 ? 'Superadmin' : 'Ops',
    nextStep: company.admins === 0 ? 'Ouvrir gestion utilisateurs' : company.outOfStock > 0 ? 'Contrôler produits' : 'Vérifier activité',
    lastUpdate: company.lastActivity || null,
  }))
);

export const filterOpsQueue = (opsQueue, opsStatusFilter) => (
  opsStatusFilter === 'all' ? opsQueue : opsQueue.filter((item) => item.status === opsStatusFilter)
);

export const buildOpsStats = (opsQueue) => ({
  todo: opsQueue.filter((item) => item.status === 'à traiter').length,
  watch: opsQueue.filter((item) => item.status === 'en surveillance').length,
  monitoring: opsQueue.filter((item) => item.status === 'monitoring').length,
});

export const buildWorkboardItems = ({ governance, detail, anomalySummary, fmtRelativeDate }) => ([
  { id: 'governance', label: 'Gouvernance', status: (governance?.admins || 0) === 0 ? 'à traiter' : 'ok', detail: `${governance?.admins || 0} admin(s) actif(s)`, link: '/user-management' },
  { id: 'stock', label: 'Stock', status: (detail?.stats?.outOfStock || 0) > 0 ? 'à traiter' : (detail?.stats?.stockLow || 0) > 0 ? 'surveillance' : 'ok', detail: `${detail?.stats?.outOfStock || 0} rupture(s) • ${detail?.stats?.stockLow || 0} low`, link: '/products' },
  { id: 'catalog', label: 'Catalogue', status: (anomalySummary.data || 0) > 0 ? 'surveillance' : 'ok', detail: `${anomalySummary.data || 0} signal(s) data`, link: '/products' },
  { id: 'activity', label: 'Activité', status: detail?.activity?.length ? 'ok' : 'surveillance', detail: detail?.activity?.length ? `Dernière action ${fmtRelativeDate(detail.activity[0]?.created_at)}` : 'Aucune activité récente', link: '/admin-console' },
]);

export const filterWorkboardItems = (workboardItems, workboardFilter) => (
  workboardFilter === 'all' ? workboardItems : workboardItems.filter((item) => item.status === workboardFilter)
);

export const buildWorkboardStats = (workboardItems) => ({
  todo: workboardItems.filter((item) => item.status === 'à traiter').length,
  watch: workboardItems.filter((item) => item.status === 'surveillance').length,
  ok: workboardItems.filter((item) => item.status === 'ok').length,
});

export const OPS_STORAGE_KEY = 'stockflow-admin-ops-state-v1';

export const loadOpsState = () => {
  if (typeof window === 'undefined') return { queue: {}, workboard: {} };
  try {
    const raw = window.localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return { queue: {}, workboard: {} };
    const parsed = JSON.parse(raw);
    return {
      queue: parsed?.queue || {},
      workboard: parsed?.workboard || {},
    };
  } catch (error) {
    console.warn('Unable to load ops state', error);
    return { queue: {}, workboard: {} };
  }
};

export const saveOpsState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Unable to save ops state', error);
  }
};

export const mergeOpsQueueWithState = (opsQueue, queueState = {}) => (
  opsQueue.map((item) => ({
    ...item,
    status: queueState[item.id]?.status || item.status,
    owner: queueState[item.id]?.owner || item.owner,
    note: queueState[item.id]?.note || '',
    persisted: Boolean(queueState[item.id]),
  }))
);

export const mergeWorkboardWithState = (workboardItems, workboardState = {}) => (
  workboardItems.map((item) => ({
    ...item,
    status: workboardState[item.id]?.status || item.status,
    note: workboardState[item.id]?.note || '',
    persisted: Boolean(workboardState[item.id]),
  }))
);

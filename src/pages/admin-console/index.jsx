import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import adminConsoleService from '../../services/adminConsoleService';
import adminConsoleOpsStateService from '../../services/adminConsoleOpsStateService';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import ListFilterBar from '../../components/ui/ListFilterBar';
import FilterDropdown from '../../components/ui/FilterDropdown';
import { buildFilteredKpis, buildHealthItems, buildOpsQueue, buildOpsStats, buildPrioritizedCompanies, buildPrioritySummary, buildUserOverview, filterOpsQueue, fmtCurrency, fmtDate, fmtRelativeDate, loadOpsState, mergeOpsQueueWithState, saveOpsState } from '../../utils/adminConsole';

const KPI_CARD_STYLES = {
  primary: 'from-primary/10 to-primary/5 border-primary/20',
  success: 'from-success/10 to-success/5 border-success/20',
  warning: 'from-warning/10 to-warning/5 border-warning/20',
  accent: 'from-accent/10 to-accent/5 border-accent/20',
  danger: 'from-error/10 to-error/5 border-error/20',
  neutral: 'from-muted/40 to-surface border-border',
};

const StatCard = ({ icon, label, value, sub, tone = 'neutral' }) => (
  <div className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm ${KPI_CARD_STYLES[tone] || KPI_CARD_STYLES.neutral}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
        {sub ? <p className="mt-1 text-xs text-text-muted">{sub}</p> : null}
      </div>
      <div className="rounded-lg bg-surface/80 p-2 text-text-primary">
        <Icon name={icon} size={18} />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, right, children }) => (
  <section className="rounded-xl border border-border bg-surface p-4 lg:p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-text-muted">{subtitle}</p> : null}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Badge = ({ tone = 'neutral', children }) => {
  const styles = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-error/10 text-error border-error/20',
    neutral: 'bg-muted text-text-muted border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone] || styles.neutral}`}>{children}</span>;
};

const QuickActionLink = ({ to, icon, title, subtitle }) => (
  <Link to={to} className="block rounded-lg border border-border/70 bg-background/60 p-3 hover:border-primary/30 hover:bg-background transition-colors">
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-muted p-2"><Icon name={icon} size={16} /></div>
      <div>
        <div className="text-sm font-medium text-text-primary">{title}</div>
        <div className="text-xs text-text-muted mt-1">{subtitle}</div>
      </div>
    </div>
  </Link>
);

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 jours', days: 7 },
  { value: '30d', label: '30 jours', days: 30 },
  { value: '90d', label: '90 jours', days: 90 },
  { value: 'all', label: 'Tout', days: null },
];

const AdminConsole = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [selectedActionPreset, setSelectedActionPreset] = useState('all');
  const [selectedExecutionLane, setSelectedExecutionLane] = useState('overview');
  const [opsStatusFilter, setOpsStatusFilter] = useState('all');
  const [opsPersistence, setOpsPersistence] = useState(() => loadOpsState());
  const [opsBackendReady, setOpsBackendReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [kpiData, companiesData, activityData, healthData] = await Promise.all([
          adminConsoleService.getGlobalKPIs(),
          adminConsoleService.getCompaniesOverview(),
          adminConsoleService.getRecentActivity(),
          adminConsoleService.getSystemHealth(),
        ]);
        setKpis(kpiData);
        setCompanies(companiesData);
        setActivity(activityData);
        setHealth(healthData);
        try {
          const queueState = await adminConsoleOpsStateService.list('queue');
          if (queueState.length) {
            setOpsPersistence((current) => ({
              ...current,
              queue: Object.fromEntries(queueState.map((item) => [item.item_key, { status: item.status, owner: item.owner, note: item.note }])),
            }));
          }
          setOpsBackendReady(true);
        } catch (stateError) {
          console.warn('Ops backend state unavailable, fallback to local only', stateError);
          setOpsBackendReady(false);
        }
      } catch (error) {
        console.error('Admin console load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const periodConfig = PERIOD_OPTIONS.find((item) => item.value === selectedPeriod) || PERIOD_OPTIONS[1];
  const cutoffDate = periodConfig.days ? new Date(Date.now() - periodConfig.days * 24 * 60 * 60 * 1000) : null;

  const filteredCompanies = useMemo(() => {
    if (selectedCompanyId === 'all') return companies;
    return companies.filter((company) => company.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  const filteredActivity = useMemo(() => {
    return activity.filter((item) => {
      const companyMatch = selectedCompanyId === 'all' || item.company_id === selectedCompanyId;
      const periodMatch = !cutoffDate || (item.created_at && new Date(item.created_at) >= cutoffDate);
      return companyMatch && periodMatch;
    });
  }, [activity, selectedCompanyId, cutoffDate]);

  const topCompanies = useMemo(
    () => [...filteredCompanies].sort((a, b) => Number(b?.stockValue || 0) - Number(a?.stockValue || 0)).slice(0, 5),
    [filteredCompanies],
  );

  const healthItems = useMemo(() => buildHealthItems(health), [health]);

  const filteredKpis = useMemo(() => buildFilteredKpis({ filteredCompanies, filteredActivity, kpis }), [filteredCompanies, filteredActivity, kpis]);

  const userOverview = useMemo(() => buildUserOverview(filteredCompanies), [filteredCompanies]);

  const prioritizedCompanies = useMemo(() => buildPrioritizedCompanies(filteredCompanies), [filteredCompanies]);

  const prioritySummary = useMemo(() => buildPrioritySummary(prioritizedCompanies), [prioritizedCompanies]);

  const visiblePrioritizedCompanies = useMemo(() => (
    selectedPriorityFilter === 'all'
      ? prioritizedCompanies
      : prioritizedCompanies.filter((company) => company.riskTone === selectedPriorityFilter)
  ), [prioritizedCompanies, selectedPriorityFilter]);

  const executionLanes = useMemo(() => ({
    overview: {
      title: 'Vue globale',
      description: 'Lecture transversale du portefeuille et des urgences.',
      companies: filteredCompanies,
      cta: '/admin-console',
    },
    restock: {
      title: 'Réassort',
      description: 'Traiter les ruptures et stocks faibles en premier.',
      companies: filteredCompanies.filter((company) => Number(company.outOfStock || 0) > 0 || Number(company.lowStock || 0) > 0),
      cta: '/products',
    },
    governance: {
      title: 'Gouvernance',
      description: 'Sécuriser admins, rôles et comptes fragiles.',
      companies: filteredCompanies.filter((company) => Number(company.admins || 0) === 0 || Number(company.users || 0) <= 1),
      cta: '/user-management',
    },
    data: {
      title: 'Qualité data',
      description: 'Corriger photos, catégories, emplacements, imports.',
      companies: filteredCompanies.filter((company) => Number(company.lowStock || 0) > 0 || Number(company.outOfStock || 0) > 0),
      cta: '/data-management',
    },
  }), [filteredCompanies]);

  const activeExecutionLane = executionLanes[selectedExecutionLane] || executionLanes.overview;

  const opsQueue = useMemo(() => mergeOpsQueueWithState(buildOpsQueue(prioritizedCompanies), opsPersistence.queue), [prioritizedCompanies, opsPersistence.queue]);

  const visibleOpsQueue = useMemo(() => filterOpsQueue(opsQueue, opsStatusFilter), [opsQueue, opsStatusFilter]);

  const opsStats = useMemo(() => buildOpsStats(opsQueue), [opsQueue]);

  const actionPresets = useMemo(() => ({
    all: filteredCompanies,
    restock: filteredCompanies.filter((company) => Number(company.outOfStock || 0) > 0 || Number(company.lowStock || 0) > 0),
    governance: filteredCompanies.filter((company) => Number(company.admins || 0) === 0 || Number(company.users || 0) <= 1),
    dormant: filteredCompanies.filter((company) => !company.lastActivity || (Date.now() - new Date(company.lastActivity).getTime()) / (1000 * 60 * 60 * 24) >= 7),
  }), [filteredCompanies]);

  const selectedPresetCompanies = actionPresets[selectedActionPreset] || filteredCompanies;

  useEffect(() => {
    saveOpsState(opsPersistence);
  }, [opsPersistence]);

  const updateQueueStatus = async (itemId, status) => {
    setOpsPersistence((current) => ({
      ...current,
      queue: {
        ...current.queue,
        [itemId]: {
          ...(current.queue?.[itemId] || {}),
          status,
        },
      },
    }));

    if (!opsBackendReady) return;

    try {
      await adminConsoleOpsStateService.upsert({
        company_id: itemId,
        scope: 'queue',
        item_key: itemId,
        status,
      });
    } catch (error) {
      console.warn('Failed to persist queue status', error);
    }
  };

  const summaryChips = [
    { label: 'Périmètre', value: selectedCompanyId === 'all' ? 'Toutes sociétés' : filteredCompanies[0]?.name || 'Société ciblée' },
    { label: 'Période', value: periodConfig.label },
    { label: 'Valeur stock', value: fmtCurrency(filteredKpis.stockValue) },
    { label: 'Alertes', value: `${filteredKpis.outOfStock} rupture(s) • ${filteredKpis.lowStock} low` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={currentRole}
        currentTenant={currentCompany}
      />

      <main className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <div className="p-4 lg:p-6 space-y-6">
          <PageHeader
            title="Admin Console"
            description="Pilotage global multi-sociétés : performance, activité, utilisateurs et gouvernance."
          />

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">
              Chargement de la console administrateur...
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-border bg-gradient-to-br from-surface to-muted/30 p-5 lg:p-6 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                  <div>
                    <p className="text-sm font-medium text-primary">Console superadmin</p>
                    <h1 className="mt-1 text-2xl lg:text-3xl font-semibold text-text-primary">Cockpit StockFlow</h1>
                    <p className="mt-2 max-w-2xl text-sm text-text-muted">
                      Vue de pilotage consolidée pour surveiller les sociétés, les accès, la qualité de donnée et les risques stock.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summaryChips.map((chip) => (
                      <div key={chip.label} className="rounded-full border border-border bg-background/70 px-3 py-2">
                        <span className="text-xs text-text-muted">{chip.label}</span>
                        <span className="ml-2 text-sm font-medium text-text-primary">{chip.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <ListFilterBar
                searchInput={
                  <div className="flex items-center h-10 rounded-xl border border-border bg-background px-4 text-sm text-text-muted">
                    Périmètre actif : {selectedCompanyId === 'all' ? 'Toutes les sociétés' : filteredCompanies[0]?.name || 'Société ciblée'} • {periodConfig.label}
                  </div>
                }
                filters={
                  <>
                    <FilterDropdown
                      label="Société"
                      value={selectedCompanyId === 'all' ? '' : selectedCompanyId}
                      onChange={(value) => setSelectedCompanyId(value || 'all')}
                      options={companies.map((company) => ({ value: company.id, label: company.name }))}
                      placeholder="Société ciblée"
                      buttonIcon="Building2"
                      className="w-full md:min-w-[240px] md:w-auto"
                    />

                    <FilterDropdown
                      label="Période"
                      value={selectedPeriod === '30d' ? '' : selectedPeriod}
                      onChange={(value) => setSelectedPeriod(value || '30d')}
                      options={PERIOD_OPTIONS.filter((option) => option.value !== '30d').map((option) => ({ value: option.value, label: option.label }))}
                      placeholder="Fenêtre temporelle"
                      buttonIcon="Calendar"
                      className="w-full md:min-w-[180px] md:w-auto"
                    />
                  </>
                }
                onReset={selectedCompanyId !== 'all' || selectedPeriod !== '30d' ? () => {
                  setSelectedCompanyId('all');
                  setSelectedPeriod('30d');
                } : null}
                resetLabel="Réinitialiser le périmètre"
                resultLabel={`${filteredCompanies.length} société${filteredCompanies.length > 1 ? 's' : ''} • ${filteredActivity.length} activité${filteredActivity.length > 1 ? 's' : ''}`}
                activeChips={[
                  ...(selectedCompanyId !== 'all' ? [{ key: 'company', label: `Société : ${filteredCompanies[0]?.name || 'Ciblée'}`, onRemove: () => setSelectedCompanyId('all') }] : []),
                  ...(selectedPeriod !== '30d' ? [{ key: 'period', label: `Période : ${periodConfig.label}`, onRemove: () => setSelectedPeriod('30d') }] : []),
                ]}
              />

              <SectionCard title="Navigation admin" subtitle="Accès directs vers les vues dédiées de la console">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <QuickActionLink to="/admin-console/companies" icon="Building2" title="Sociétés" subtitle="Risques, classement et accès fiche société" />
                  <QuickActionLink to="/admin-console/operations" icon="ShieldAlert" title="Operations" subtitle="Queue ops, traitement et surveillance" />
                  <QuickActionLink to="/admin-console/data-quality" icon="Database" title="Data Quality" subtitle="Qualité de données et anomalies structurelles" />
                  <QuickActionLink to="/admin-console/activity" icon="Activity" title="Activity" subtitle="Journal d’activité multi-sociétés" />
                </div>
              </SectionCard>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-9">
                  <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard icon="Building2" label="Sociétés visibles" value={filteredKpis.companies} sub="Périmètre actif" tone="primary" />
                    <StatCard icon="Users" label="Utilisateurs visibles" value={filteredKpis.users} sub={`${filteredKpis.activeUsers} actifs visibles`} tone="accent" />
                    <StatCard icon="Package" label="Produits visibles" value={filteredKpis.products} sub="Catalogue couvert par le filtre" tone="success" />
                    <StatCard icon="Euro" label="Valeur de stock" value={fmtCurrency(filteredKpis.stockValue)} sub={`${filteredKpis.lowStock} low stock • ${filteredKpis.outOfStock} ruptures`} tone="warning" />
                  </section>

                  <section className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard icon="MapPin" label="Emplacements visibles" value={filteredKpis.locations} sub="Sites et zones dans le périmètre" />
                    <StatCard icon="ArrowUpDown" label="Mouvements observés" value={filteredKpis.stockMovements} sub={`Sur ${periodConfig.label.toLowerCase()}`} />
                    <StatCard icon="AlertTriangle" label="Ruptures à traiter" value={filteredKpis.outOfStock} sub="Produits à réapprovisionner" tone="danger" />
                    <StatCard icon="TrendingDown" label="Stocks faibles" value={filteredKpis.lowStock} sub="Sous le seuil minimum" tone="warning" />
                  </section>
                </div>

                <div className="xl:col-span-3">
                  <SectionCard
                    title="Santé de la donnée"
                    subtitle="Lecture rapide des risques et écarts à corriger"
                  >
                    <div className="space-y-3">
                      {healthItems.map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                          <span className="text-sm text-text-primary">{item.label}</span>
                          <span className={`text-sm font-semibold ${item.value > 0 ? 'text-warning' : 'text-success'}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <SectionCard
                    title="Lanes d’exécution"
                    subtitle="Choisis un mode opératoire selon la famille d’action à mener"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                      {Object.entries(executionLanes).map(([key, lane]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedExecutionLane(key)}
                          className={`rounded-xl border p-4 text-left transition-colors ${selectedExecutionLane === key ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/60 hover:border-primary/20'}`}
                        >
                          <div className="text-sm font-semibold text-text-primary">{lane.title}</div>
                          <div className="mt-1 text-xs text-text-muted">{lane.description}</div>
                          <div className="mt-3 text-xs font-medium text-primary">{lane.companies.length} société(s)</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4">
                  <SectionCard
                    title="Action recommandée"
                    subtitle="Point d’entrée suggéré selon la lane choisie"
                  >
                    <div className="mb-3 text-xs text-text-muted">Backend suivi ops: {opsBackendReady ? 'connecté' : 'fallback local'}</div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                      <div className="text-sm font-semibold text-text-primary">{activeExecutionLane.title}</div>
                      <p className="mt-1 text-sm text-text-muted">{activeExecutionLane.description}</p>
                      <div className="mt-3 text-xs text-text-muted">{activeExecutionLane.companies.length} société(s) concernée(s)</div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link to={activeExecutionLane.cta} className="text-sm font-medium text-primary hover:text-primary/80">
                          Ouvrir la zone recommandée
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedActionPreset(selectedExecutionLane === 'restock' ? 'restock' : selectedExecutionLane === 'governance' ? 'governance' : selectedExecutionLane === 'data' ? 'restock' : 'all')}
                          className="text-sm font-medium text-text-muted hover:text-text-primary"
                        >
                          Appliquer au preset visible
                        </button>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <SectionCard
                    title="Queue opérationnelle"
                    subtitle="Vue courte des éléments à traiter maintenant"
                    right={<Link to="/admin-console/operations" className="text-sm font-medium text-primary hover:text-primary/80">Ouvrir la page operations</Link>}
                  >
                    <div className="space-y-3">
                      {visibleOpsQueue.slice(0, 5).map((item) => (
                        <div key={item.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">{item.companyName}</span>
                                <Badge tone={item.status === 'à traiter' ? 'danger' : item.status === 'en surveillance' ? 'warning' : 'accent'}>{item.status}</Badge>
                              </div>
                              <div className="mt-1 text-xs text-text-muted">{item.nextStep}</div>
                            </div>
                            <Link to={`/admin-console/company/${item.companyId}`} className="text-sm font-medium text-primary hover:text-primary/80">Ouvrir</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4">
                  <SectionCard
                    title="Sociétés prioritaires"
                    subtitle="Le top des sociétés à regarder maintenant"
                    right={<Link to="/admin-console/companies" className="text-sm font-medium text-primary hover:text-primary/80">Voir toutes</Link>}
                  >
                    <div className="space-y-3">
                      {prioritizedCompanies.slice(0, 4).map((company) => (
                        <div key={company.id} className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-text-primary">{company.name}</div>
                              <div className="text-xs text-text-muted">{company.riskReasons.join(' • ') || 'Sous contrôle'}</div>
                            </div>
                            <Badge tone={company.riskTone}>{company.riskLabel}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </section>

              <SectionCard
                title="Journal d’activité"
                subtitle="Dernières actions système, imports, exports et événements de gestion dans le périmètre actif"
                right={<span className="text-sm text-text-muted">{filteredActivity.length} entrée(s)</span>}
              >
                <div className="space-y-3">
                  {filteredActivity.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-text-primary">{item.action} • {item.table_name}</div>
                          <div className="text-xs text-text-muted">company_id: {item.company_id || '—'} • by {item.created_by || '—'}</div>
                        </div>
                        <div className="text-xs text-text-muted whitespace-nowrap">{fmtDate(item.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminConsole;

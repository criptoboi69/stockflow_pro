import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import PageHeader from '../../components/ui/PageHeader';
import adminConsoleService from '../../services/adminConsoleService';
import adminConsoleOpsStateService from '../../services/adminConsoleOpsStateService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { buildActivityFeed, buildAnomalySummary, buildCompanyAnomalies, buildCompanyHealthSummary, buildGovernanceSummary, buildUrgentActions, buildWorkboardItems, buildWorkboardStats, filterWorkboardItems, fmtCurrency, fmtDate, fmtRelativeDate, loadOpsState, mergeWorkboardWithState, saveOpsState } from '../../utils/adminConsole';

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
        <div className="text-sm text-text-muted">{label}</div>
        <div className="mt-2 text-2xl font-semibold text-text-primary">{value}</div>
        {sub ? <div className="mt-1 text-xs text-text-muted">{sub}</div> : null}
      </div>
      <div className="rounded-lg bg-surface/80 p-2 text-text-primary">
        <Icon name={icon} size={18} />
      </div>
    </div>
  </div>
);

const Card = ({ title, subtitle, children, right }) => (
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

const activityMeta = (item) => {
  const action = String(item?.action || '').toLowerCase();
  const table = String(item?.table_name || '').toLowerCase();

  if (table.includes('stock') || action.includes('stock')) {
    return { icon: 'Package2', tone: 'warning', label: 'Stock' };
  }
  if (table.includes('user') || action.includes('user') || action.includes('invite')) {
    return { icon: 'Users', tone: 'accent', label: 'Utilisateurs' };
  }
  if (table.includes('product')) {
    return { icon: 'Package', tone: 'success', label: 'Produits' };
  }
  if (table.includes('location')) {
    return { icon: 'MapPin', tone: 'primary', label: 'Emplacements' };
  }
  return { icon: 'Activity', tone: 'neutral', label: 'Activité' };
};

const CompanyDetail = () => {
  const { companyId } = useParams();
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [highlightFilter, setHighlightFilter] = useState('all');
  const [activeActionZone, setActiveActionZone] = useState('overview');
  const [selectedActionPlan, setSelectedActionPlan] = useState('priority');
  const [workboardFilter, setWorkboardFilter] = useState('all');
  const [opsPersistence, setOpsPersistence] = useState(() => loadOpsState());
  const [opsBackendReady, setOpsBackendReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getCompanyDetail(companyId);
        setDetail(data);
        try {
          const workboardState = await adminConsoleOpsStateService.list('workboard', companyId);
          if (workboardState.length) {
            setOpsPersistence((current) => ({
              ...current,
              workboard: Object.fromEntries(workboardState.map((item) => [item.item_key, { status: item.status, note: item.note }])),
            }));
          }
          setOpsBackendReady(true);
        } catch (stateError) {
          console.warn('Workboard backend state unavailable, fallback to local only', stateError);
          setOpsBackendReady(false);
        }
      } catch (error) {
        console.error('Company detail load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const healthSummary = useMemo(() => buildCompanyHealthSummary(detail), [detail]);

  const governance = useMemo(() => buildGovernanceSummary(detail), [detail]);

  const anomalies = useMemo(() => buildCompanyAnomalies(detail, governance), [detail, governance]);

  const activityFeed = useMemo(() => buildActivityFeed(detail, activityMeta), [detail]);

  const anomalySummary = useMemo(() => buildAnomalySummary(anomalies), [anomalies]);

  const topAnomalies = anomalies.slice(0, 8);

  const urgentActions = useMemo(() => buildUrgentActions({ detail, governance, healthSummary }), [detail, governance, healthSummary]);

  const filteredAnomalies = useMemo(() => (
    highlightFilter === 'all' ? topAnomalies : topAnomalies.filter((item) => item.severity === highlightFilter)
  ), [highlightFilter, topAnomalies]);

  const workboardItems = useMemo(() => mergeWorkboardWithState(buildWorkboardItems({ governance, detail, anomalySummary, fmtRelativeDate }), opsPersistence.workboard), [anomalySummary, detail, governance, opsPersistence.workboard]);

  const visibleWorkboardItems = useMemo(() => filterWorkboardItems(workboardItems, workboardFilter), [workboardFilter, workboardItems]);

  const workboardStats = useMemo(() => buildWorkboardStats(workboardItems), [workboardItems]);

  useEffect(() => {
    saveOpsState(opsPersistence);
  }, [opsPersistence]);

  const updateWorkboardStatus = async (itemId, status) => {
    setOpsPersistence((current) => ({
      ...current,
      workboard: {
        ...current.workboard,
        [itemId]: {
          ...(current.workboard?.[itemId] || {}),
          status,
        },
      },
    }));

    if (!opsBackendReady) return;

    try {
      await adminConsoleOpsStateService.upsert({
        company_id: companyId,
        scope: 'workboard',
        item_key: itemId,
        status,
      });
    } catch (error) {
      console.warn('Failed to persist workboard status', error);
    }
  };

  const actionPlans = useMemo(() => ({
    priority: {
      title: 'Traiter les urgences',
      steps: [
        'Lire les priorités d’intervention',
        'Filtrer les anomalies critiques',
        'Ouvrir la zone concernée et corriger',
      ],
      link: actionZoneLinks[activeActionZone],
    },
    governance: {
      title: 'Sécuriser la gouvernance',
      steps: [
        'Vérifier le nombre d’admins actifs',
        'Revoir les utilisateurs inactifs',
        'Ajuster les rôles si nécessaire',
      ],
      link: '/user-management',
    },
    catalog: {
      title: 'Nettoyer le catalogue',
      steps: [
        'Traiter les ruptures',
        'Compléter photos / catégories / emplacements',
        'Contrôler les produits stratégiques',
      ],
      link: '/products',
    },
  }), [activeActionZone]);

  const activeActionPlan = actionPlans[selectedActionPlan] || actionPlans.priority;

  const actionZoneLinks = {
    overview: '/admin-console',
    users: '/user-management',
    products: '/products',
    locations: '/locations',
    data: '/data-management',
  };

  const contextualActions = useMemo(() => ([
    { key: 'overview', label: 'Vue globale', description: 'Revenir au cockpit superadmin', value: `${anomalySummary.critical} critique(s)` },
    { key: 'users', label: 'Utilisateurs', description: 'Traiter les rôles, admins et accès inactifs', value: `${governance?.admins || 0} admin(s)` },
    { key: 'products', label: 'Produits', description: 'Corriger ruptures, photos et catégories', value: `${detail?.stats?.outOfStock || 0} rupture(s)` },
    { key: 'locations', label: 'Emplacements', description: 'Vérifier la couverture terrain', value: `${detail?.stats?.locations || 0} emplacement(s)` },
    { key: 'data', label: 'Data', description: 'Nettoyer imports / qualité catalogue', value: `${anomalySummary.data} signal(s)` },
  ]), [anomalySummary, detail, governance]);

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
            title={detail?.company?.name || 'Détail société'}
            description="Vue détaillée société : utilisateurs, inventaire, activité et contrôle."
          />

          <div className="flex items-center justify-between">
            <Link to="/admin-console">
              <Button variant="outline" iconName="ArrowLeft" iconPosition="left">Retour Admin Console</Button>
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">Chargement du détail société...</div>
          ) : detail ? (
            <>
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 rounded-2xl border border-border bg-gradient-to-br from-surface to-muted/30 p-5 lg:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary">Fiche société</p>
                      <h1 className="mt-1 text-2xl lg:text-3xl font-semibold text-text-primary">{detail.company?.name || 'Société'}</h1>
                      <p className="mt-2 max-w-2xl text-sm text-text-muted">
                        Contrôle détaillé des utilisateurs, de l’inventaire, de l’activité et de la gouvernance de cette société.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="text-xs text-text-muted">Créée le</div>
                        <div className="mt-1 text-sm font-semibold text-text-primary">{fmtDate(detail.company?.created_at)}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <div className="text-xs text-text-muted">Abonnement</div>
                        <div className="mt-1 text-sm font-semibold text-text-primary">{detail.company?.subscription_type || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="xl:col-span-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Santé rapide</p>
                      <p className="text-xs text-text-muted">Qualité et risques de cette société</p>
                    </div>
                    <div className="rounded-lg bg-muted p-2"><Icon name="ShieldAlert" size={18} /></div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {healthSummary.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                        <span className="text-sm text-text-primary">{item.label}</span>
                        <span className={`text-sm font-semibold ${item.value > 0 ? 'text-warning' : 'text-success'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard icon="Users" label="Utilisateurs" value={detail.stats.users} sub={`${detail.stats.admins} admin(s)`} tone="accent" />
                <StatCard icon="Package" label="Produits" value={detail.stats.products} sub={`${detail.stats.stockLow} low stock`} tone="success" />
                <StatCard icon="MapPin" label="Emplacements" value={detail.stats.locations} sub="Sites et zones actives" />
                <StatCard icon="Euro" label="Valeur stock" value={fmtCurrency(detail.stats.stockValue)} sub={`${detail.stats.outOfStock} rupture(s)`} tone="warning" />
                <StatCard icon="ShieldCheck" label="Statut société" value={detail.company?.status || 'N/A'} sub={detail.company?.subscription_type || 'Abonnement N/A'} tone="primary" />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card title="Infos société" subtitle="Informations principales et cadrage de gestion" right={<span className="text-sm text-text-muted">{detail.company?.id}</span>}>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span>Nom</span><strong>{detail.company?.name || '—'}</strong></div>
                    <div className="flex items-center justify-between"><span>Créée le</span><strong>{fmtDate(detail.company?.created_at)}</strong></div>
                    <div className="flex items-center justify-between"><span>Abonnement</span><strong>{detail.company?.subscription_type || 'N/A'}</strong></div>
                    <div className="flex items-center justify-between"><span>Statut</span><strong>{detail.company?.status || 'N/A'}</strong></div>
                  </div>
                </Card>

                <Card title="Contrôle stock" subtitle="Points de vigilance opérationnels">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span>Stock faible</span><strong>{detail.stats.stockLow}</strong></div>
                    <div className="flex items-center justify-between"><span>Ruptures</span><strong>{detail.stats.outOfStock}</strong></div>
                    <div className="flex items-center justify-between"><span>Produits sans photo</span><strong>{healthSummary[2]?.value || 0}</strong></div>
                    <div className="flex items-center justify-between"><span>Produits sans emplacement</span><strong>{healthSummary[3]?.value || 0}</strong></div>
                  </div>
                </Card>

                <Card title="Activité récente" subtitle="Ce qui s’est passé récemment dans cette société" right={<span className="text-sm text-text-muted">{activityFeed.length} événement(s)</span>}>
                  <div className="space-y-3">
                    {activityFeed.length > 0 ? activityFeed.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/60 bg-background/50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-muted p-2"><Icon name={item.meta.icon} size={16} /></div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-text-primary">{item.action}</span>
                                <Badge tone={item.meta.tone}>{item.meta.label}</Badge>
                              </div>
                              <div className="mt-1 text-xs text-text-muted">{item.table_name || 'Table inconnue'} • {fmtDate(item.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-text-muted whitespace-nowrap">{fmtRelativeDate(item.created_at)}</div>
                        </div>
                      </div>
                    )) : <div className="text-sm text-text-muted">Aucune activité récente.</div>}
                  </div>
                </Card>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <Card
                    title="Workboard société"
                    subtitle="Vue compacte des chantiers à traiter sur cette société"
                    right={
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setWorkboardFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs ${workboardFilter === 'all' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background/60 text-text-primary'}`}>Tous</button>
                        <button type="button" onClick={() => setWorkboardFilter('à traiter')} className={`rounded-full border px-3 py-1.5 text-xs ${workboardFilter === 'à traiter' ? 'border-error/40 bg-error/10 text-error' : 'border-border bg-background/60 text-text-primary'}`}>À traiter</button>
                        <button type="button" onClick={() => setWorkboardFilter('surveillance')} className={`rounded-full border px-3 py-1.5 text-xs ${workboardFilter === 'surveillance' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-border bg-background/60 text-text-primary'}`}>Surveillance</button>
                      </div>
                    }
                  >
                    <div className="space-y-3">
                      {visibleWorkboardItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                                <Badge tone={item.status === 'à traiter' ? 'danger' : item.status === 'surveillance' ? 'warning' : 'success'}>{item.status}</Badge>
                              </div>
                              <div className="mt-2 text-sm text-text-muted">{item.detail}</div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Link to={item.link} className="text-sm font-medium text-primary hover:text-primary/80">Ouvrir</Link>
                              <button type="button" onClick={() => updateWorkboardStatus(item.id, item.status === 'à traiter' ? 'surveillance' : item.status === 'surveillance' ? 'ok' : 'à traiter')} className="text-sm font-medium text-text-muted hover:text-text-primary">Changer statut</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-4">
                  <Card title="Pilotage local" subtitle="Statut rapide des zones suivies">
                    <div className="mb-3 text-xs text-text-muted">Backend suivi ops: {opsBackendReady ? 'connecté' : 'fallback local'}</div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">À traiter</div>
                        <div className="mt-1 text-2xl font-semibold text-text-primary">{workboardStats.todo}</div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">Surveillance</div>
                        <div className="mt-1 text-2xl font-semibold text-text-primary">{workboardStats.watch}</div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">Zones OK</div>
                        <div className="mt-1 text-2xl font-semibold text-text-primary">{workboardStats.ok}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <Card title="Plans d’action" subtitle="Choisis un plan d’exécution selon la situation observée">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(actionPlans).map(([key, plan]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedActionPlan(key)}
                          className={`rounded-xl border p-4 text-left transition-colors ${selectedActionPlan === key ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/60 hover:border-primary/20'}`}
                        >
                          <div className="text-sm font-semibold text-text-primary">{plan.title}</div>
                          <div className="mt-2 text-xs text-text-muted">{plan.steps[0]}</div>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-4">
                  <Card title="Exécution guidée" subtitle="Mini checklist actionnable">
                    <div className="space-y-3">
                      {activeActionPlan.steps.map((step, index) => (
                        <div key={step} className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                          <div className="text-xs text-text-muted">Étape {index + 1}</div>
                          <div className="mt-1 text-sm text-text-primary">{step}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Link to={activeActionPlan.link} className="text-sm font-medium text-primary hover:text-primary/80">
                        Ouvrir la zone pour exécuter
                      </Link>
                    </div>
                  </Card>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <Card
                    title="Actions contextualisées"
                    subtitle="Choisis la zone à traiter selon le problème rencontré sur cette société"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      {contextualActions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          onClick={() => setActiveActionZone(action.key)}
                          className={`rounded-xl border p-4 text-left transition-colors ${activeActionZone === action.key ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/60 hover:border-primary/20'}`}
                        >
                          <div className="text-sm font-semibold text-text-primary">{action.label}</div>
                          <div className="mt-1 text-xs text-text-muted">{action.description}</div>
                          <div className="mt-3 text-xs font-medium text-primary">{action.value}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link to={actionZoneLinks[activeActionZone]} className="text-sm font-medium text-primary hover:text-primary/80">
                        Ouvrir la zone sélectionnée
                      </Link>
                      <Link to="/admin-console" className="text-sm font-medium text-text-muted hover:text-text-primary">
                        Retour cockpit global
                      </Link>
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-4">
                  <Card title="Mode opératoire" subtitle="Chemin recommandé pour corriger rapidement">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3 text-sm text-text-primary">
                        1. Lis les priorités d’intervention.
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3 text-sm text-text-primary">
                        2. Filtre les anomalies pour isoler la bonne famille de problème.
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3 text-sm text-text-primary">
                        3. Ouvre la zone liée pour corriger immédiatement.
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8">
                  <Card
                    title="Priorités d’intervention"
                    subtitle="Ce qu’un superadmin doit traiter en premier sur cette société"
                    right={
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="danger">{anomalySummary.critical} critique(s)</Badge>
                        <Badge tone="warning">{anomalySummary.warning} warning(s)</Badge>
                        <Badge tone="accent">{anomalySummary.data} qualité data</Badge>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {urgentActions.length > 0 ? urgentActions.map((action) => (
                        <div key={action.title} className="rounded-xl border border-border/70 bg-background/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-text-primary">{action.title}</div>
                              <p className="mt-1 text-sm text-text-muted">{action.description}</p>
                              <div className="mt-3 flex flex-wrap gap-3">
                                <Link to="/user-management" className="text-xs font-medium text-primary hover:text-primary/80">Ouvrir gestion utilisateurs</Link>
                                <Link to="/products" className="text-xs font-medium text-primary hover:text-primary/80">Ouvrir produits</Link>
                              </div>
                            </div>
                            <Badge tone={action.tone}>{action.tone}</Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success">
                          Aucun point urgent détecté pour cette société.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-4">
                  <Card title="Lecture urgence" subtitle="Résumé court pour décider vite">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">Gouvernance</div>
                        <div className="mt-1 flex items-end justify-between gap-3">
                          <span className="text-2xl font-semibold text-text-primary">{governance?.admins || 0}</span>
                          <span className="text-xs text-text-muted">admin(s) actif(s)</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">Catalogue en rupture</div>
                        <div className="mt-1 flex items-end justify-between gap-3">
                          <span className="text-2xl font-semibold text-text-primary">{detail.stats.outOfStock}</span>
                          <span className="text-xs text-text-muted">produit(s)</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                        <div className="text-xs text-text-muted">Dernière activité</div>
                        <div className="mt-1 flex items-end justify-between gap-3">
                          <span className="text-lg font-semibold text-text-primary">{fmtRelativeDate(detail.activity?.[0]?.created_at || detail.company?.created_at)}</span>
                          <span className="text-xs text-text-muted">signal le plus récent</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card title="Gouvernance & abonnement" subtitle="Lecture superadmin des accès, du plan et de la qualité administrative">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                          <div className="text-xs text-text-muted">Type d’abonnement</div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge tone="primary">{detail.company?.subscription_type || 'N/A'}</Badge>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                          <div className="text-xs text-text-muted">Statut société</div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge tone={String(detail.company?.status || '').toLowerCase() === 'active' ? 'success' : 'warning'}>{detail.company?.status || 'N/A'}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between"><span>Admins</span><strong>{governance?.admins || 0}</strong></div>
                        <div className="flex items-center justify-between"><span>Managers</span><strong>{governance?.managers || 0}</strong></div>
                        <div className="flex items-center justify-between"><span>Employees</span><strong>{governance?.employees || 0}</strong></div>
                        <div className="flex items-center justify-between"><span>Utilisateurs actifs</span><strong>{governance?.activeUsers || 0}</strong></div>
                        <div className="flex items-center justify-between"><span>Utilisateurs inactifs</span><strong>{governance?.inactiveUsers || 0}</strong></div>
                        <div className="flex items-center justify-between"><span>Profils sans nom</span><strong>{governance?.missingNames || 0}</strong></div>
                      </div>
                    </Card>

                    <Card title="Actions rapides société" subtitle="Accès rapides pour piloter la société et naviguer plus vite">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <QuickActionLink to="/user-management" icon="Users" title="Gérer les utilisateurs" subtitle="Voir les accès et les rôles" />
                        <QuickActionLink to="/products" icon="Package" title="Voir les produits" subtitle="Accéder au catalogue de la société" />
                        <QuickActionLink to="/locations" icon="MapPin" title="Voir les emplacements" subtitle="Contrôler les zones et capacités" />
                        <QuickActionLink to="/data-management" icon="Database" title="Data Management" subtitle="Imports, exports et historique" />
                      </div>
                    </Card>
                  </section>

                  <Card title="Utilisateurs société" subtitle="Répartition des accès et pilotage de l’équipe" right={<span className="text-sm text-text-muted">{detail.users.length} utilisateur(s)</span>}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left text-text-muted">
                            <th className="py-2 pr-3">Nom</th>
                            <th className="py-2 pr-3">Email</th>
                            <th className="py-2 pr-3">Rôle</th>
                            <th className="py-2">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.users.map((user) => (
                            <tr key={user.id} className="border-b border-border/50">
                              <td className="py-3 pr-3 font-medium text-text-primary">{user.full_name || 'Utilisateur'}</td>
                              <td className="py-3 pr-3 text-text-muted">{user.email || '—'}</td>
                              <td className="py-3 pr-3 text-text-primary">{user.role}</td>
                              <td className="py-3 text-text-primary">{user.is_active === false ? 'Inactif' : 'Actif'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>

                <div className="xl:col-span-1 space-y-6">
                  <Card title="Anomalies société" subtitle="Liste priorisée des points à corriger pour cette société" right={<span className="text-sm text-text-muted">{anomalies.length} anomalie(s)</span>}>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                        <div className="text-xs text-text-muted">Critiques</div>
                        <div className="mt-1 text-lg font-semibold text-text-primary">{anomalySummary.critical}</div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                        <div className="text-xs text-text-muted">Warnings</div>
                        <div className="mt-1 text-lg font-semibold text-text-primary">{anomalySummary.warning}</div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                        <div className="text-xs text-text-muted">Data</div>
                        <div className="mt-1 text-lg font-semibold text-text-primary">{anomalySummary.data}</div>
                      </div>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setHighlightFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs ${highlightFilter === 'all' ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background/60 text-text-primary'}`}>Toutes</button>
                      <button type="button" onClick={() => setHighlightFilter('danger')} className={`rounded-full border px-3 py-1.5 text-xs ${highlightFilter === 'danger' ? 'border-error/40 bg-error/10 text-error' : 'border-border bg-background/60 text-text-primary'}`}>Critiques</button>
                      <button type="button" onClick={() => setHighlightFilter('warning')} className={`rounded-full border px-3 py-1.5 text-xs ${highlightFilter === 'warning' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-border bg-background/60 text-text-primary'}`}>Warnings</button>
                      <button type="button" onClick={() => setHighlightFilter('accent')} className={`rounded-full border px-3 py-1.5 text-xs ${highlightFilter === 'accent' ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-background/60 text-text-primary'}`}>Data</button>
                    </div>
                    <div className="space-y-3">
                      {filteredAnomalies.length > 0 ? filteredAnomalies.map((item, idx) => (
                        <div key={`${item.type}-${item.label}-${idx}`} className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-text-primary">{item.type}</div>
                              <div className="text-sm text-text-primary">{item.label}</div>
                              <div className="text-xs text-text-muted">{item.meta}</div>
                              <div className="mt-2">
                                <Link to={item.type.includes('Utilisateur') || item.type.includes('admin') ? '/user-management' : '/products'} className="text-xs font-medium text-primary hover:text-primary/80">
                                  Aller vers la zone concernée
                                </Link>
                              </div>
                            </div>
                            <Badge tone={item.severity === 'danger' ? 'danger' : item.severity === 'warning' ? 'warning' : item.severity === 'accent' ? 'accent' : 'neutral'}>
                              {item.severity}
                            </Badge>
                          </div>
                        </div>
                      )) : <div className="text-sm text-success">Aucune anomalie critique détectée.</div>}
                    </div>
                  </Card>
                </div>
              </section>

              <Card title="Produits société" subtitle="Aperçu rapide du catalogue de la société" right={<span className="text-sm text-text-muted">{detail.products.length} produit(s)</span>}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-text-muted">
                        <th className="py-2 pr-3">Produit</th>
                        <th className="py-2 pr-3">SKU</th>
                        <th className="py-2 pr-3">Catégorie</th>
                        <th className="py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.products.slice(0, 15).map((product) => (
                        <tr key={product.id} className="border-b border-border/50">
                          <td className="py-3 pr-3 font-medium text-text-primary">{product.name}</td>
                          <td className="py-3 pr-3 text-text-muted">{product.sku || '—'}</td>
                          <td className="py-3 pr-3 text-text-primary">{product.category || '—'}</td>
                          <td className="py-3 text-text-primary">{product.quantity || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default CompanyDetail;

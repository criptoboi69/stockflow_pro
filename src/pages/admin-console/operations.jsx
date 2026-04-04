import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import PageHeader from '../../components/ui/PageHeader';
import adminConsoleService from '../../services/adminConsoleService';
import { useAuth } from '../../contexts/AuthContext';
import { buildOpsQueue, buildOpsStats, buildPrioritizedCompanies, filterOpsQueue } from '../../utils/adminConsole';

const Badge = ({ tone = 'neutral', children }) => {
  const styles = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-error/10 text-error border-error/20',
    neutral: 'bg-muted text-text-muted border-border',
    accent: 'bg-accent/10 text-accent border-accent/20',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone] || styles.neutral}`}>{children}</span>;
};

const OperationsAdminPage = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getCompaniesOverview();
        setCompanies(data);
      } catch (error) {
        console.error('Operations admin load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const opsQueue = useMemo(() => buildOpsQueue(buildPrioritizedCompanies(companies)), [companies]);
  const visibleOpsQueue = useMemo(() => filterOpsQueue(opsQueue, statusFilter), [opsQueue, statusFilter]);
  const opsStats = useMemo(() => buildOpsStats(opsQueue), [opsQueue]);

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
          <PageHeader title="Admin Console · Operations" description="Vue dédiée à la queue opérationnelle et aux statuts de traitement." />

          <div className="flex flex-wrap gap-2">
            {['all', 'à traiter', 'en surveillance', 'monitoring'].map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-full border px-3 py-1.5 text-xs ${statusFilter === status ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-background/60 text-text-primary'}`}>
                {status}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-surface p-4"><div className="text-xs text-text-muted">À traiter</div><div className="mt-1 text-2xl font-semibold text-text-primary">{opsStats.todo}</div></div>
            <div className="rounded-xl border border-border bg-surface p-4"><div className="text-xs text-text-muted">Surveillance</div><div className="mt-1 text-2xl font-semibold text-text-primary">{opsStats.watch}</div></div>
            <div className="rounded-xl border border-border bg-surface p-4"><div className="text-xs text-text-muted">Monitoring</div><div className="mt-1 text-2xl font-semibold text-text-primary">{opsStats.monitoring}</div></div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">Chargement des opérations...</div>
          ) : (
            <section className="rounded-xl border border-border bg-surface p-4 lg:p-5 shadow-sm">
              <div className="space-y-3">
                {visibleOpsQueue.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{item.companyName}</span>
                          <Badge tone={item.status === 'à traiter' ? 'danger' : item.status === 'en surveillance' ? 'warning' : 'accent'}>{item.status}</Badge>
                        </div>
                        <div className="mt-1 text-xs text-text-muted">Owner: {item.owner} • Lane: {item.lane}</div>
                        <div className="mt-2 text-sm text-text-muted">{item.nextStep}</div>
                      </div>
                      <Link to={`/admin-console/company/${item.companyId}`} className="text-sm font-medium text-primary hover:text-primary/80">Ouvrir</Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default OperationsAdminPage;

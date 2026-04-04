import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import PageHeader from '../../components/ui/PageHeader';
import adminConsoleService from '../../services/adminConsoleService';
import { useAuth } from '../../contexts/AuthContext';
import { buildPrioritizedCompanies, fmtCurrency, fmtDate } from '../../utils/adminConsole';

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

const CompaniesAdminPage = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getCompaniesOverview();
        setCompanies(data);
      } catch (error) {
        console.error('Companies admin load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const prioritizedCompanies = useMemo(() => buildPrioritizedCompanies(companies), [companies]);

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
          <PageHeader title="Admin Console · Sociétés" description="Vue dédiée aux sociétés, leurs risques et leur état global." />

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">Chargement des sociétés...</div>
          ) : (
            <section className="rounded-xl border border-border bg-surface p-4 lg:p-5 shadow-sm">
              <div className="space-y-3">
                {prioritizedCompanies.map((company, index) => (
                  <div key={company.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">#{index + 1}</span>
                          <span className="text-sm font-semibold text-text-primary">{company.name}</span>
                          <Badge tone={company.riskTone}>{company.riskLabel}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-text-muted">{company.riskReasons.join(' • ') || 'Aucun signal critique détecté'}</div>
                        <div className="mt-2 text-xs text-text-muted">{company.users} users • {company.products} produits • {fmtDate(company.lastActivity)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-primary">{fmtCurrency(company.stockValue)}</div>
                        <Link to={`/admin-console/company/${company.id}`} className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary/80">Ouvrir</Link>
                      </div>
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

export default CompaniesAdminPage;

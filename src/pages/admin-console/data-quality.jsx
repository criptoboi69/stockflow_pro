import React, { useEffect, useMemo, useState } from 'react';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import PageHeader from '../../components/ui/PageHeader';
import adminConsoleService from '../../services/adminConsoleService';
import { useAuth } from '../../contexts/AuthContext';
import { buildHealthItems } from '../../utils/adminConsole';

const DataQualityAdminPage = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getSystemHealth();
        setHealth(data);
      } catch (error) {
        console.error('Data quality load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const items = useMemo(() => buildHealthItems(health), [health]);

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
          <PageHeader title="Admin Console · Data Quality" description="Vue dédiée à la qualité des données et aux anomalies structurelles." />

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">Chargement qualité data...</div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                  <div className="text-sm text-text-muted">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-text-primary">{item.value}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default DataQualityAdminPage;

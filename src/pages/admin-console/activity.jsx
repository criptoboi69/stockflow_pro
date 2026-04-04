import React, { useEffect, useState } from 'react';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import PageHeader from '../../components/ui/PageHeader';
import adminConsoleService from '../../services/adminConsoleService';
import { useAuth } from '../../contexts/AuthContext';
import { fmtDate } from '../../utils/adminConsole';

const ActivityAdminPage = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getRecentActivity(50);
        setActivity(data);
      } catch (error) {
        console.error('Activity admin load error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          <PageHeader title="Admin Console · Activity" description="Vue dédiée au journal d’activité multi-sociétés." />

          {loading ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">Chargement de l’activité...</div>
          ) : (
            <section className="rounded-xl border border-border bg-surface p-4 lg:p-5 shadow-sm">
              <div className="space-y-3">
                {activity.map((item) => (
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
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ActivityAdminPage;

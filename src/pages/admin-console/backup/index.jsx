import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import PageHeader from '../../components/ui/PageHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import adminConsoleService from '../../services/adminConsoleService';
import Icon from '../../components/AppIcon';

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colorClasses[color] || colorClasses.primary}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center">
          <Icon name={icon} size={24} />
        </div>
      </div>
    </div>
  );
};

const NavCard = ({ to, icon, title, description, badge }) => (
  <Link
    to={to}
    className="group block rounded-xl border border-border bg-surface p-5 hover:border-primary/50 hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon name={icon} size={24} className="text-primary" />
      </div>
      {badge && (
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-error/10 text-error">
          {badge}
        </span>
      )}
    </div>
    <h3 className="mt-4 text-base font-semibold text-text-primary">{title}</h3>
    <p className="mt-1.5 text-sm text-text-muted">{description}</p>
  </Link>
);

const AlertCard = ({ icon, title, description, severity = 'warning' }) => {
  const severityClasses = {
    warning: 'bg-warning/5 border-warning/20 text-warning',
    error: 'bg-error/5 border-error/20 text-error',
  };

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${severityClasses[severity]}`}>
      <Icon name={icon} size={20} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
      </div>
    </div>
  );
};

const AdminConsole = () => {
  const { currentRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    companies: 0,
    users: 0,
    activeOps: 0,
    alerts: 0
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsData, alertsData] = await Promise.all([
          adminConsoleService.getDashboardStats(),
          adminConsoleService.getAlerts()
        ]);
        setStats(statsData);
        setAlerts(alertsData);
      } catch (error) {
        logger.error('Admin console dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const navItems = useMemo(() => [
    {
      to: '/admin-console/companies',
      icon: 'Building2',
      title: 'Entreprises',
      description: 'Gérer les sociétés et leurs configurations',
      badge: stats.companies > 0 ? null : null
    },
    {
      to: '/admin-console/users',
      icon: 'Users',
      title: 'Utilisateurs',
      description: 'Gestion multi-sociétés et rôles',
      badge: stats.users > 100 ? `${stats.users}` : null
    },
    {
      to: '/admin-console/operations',
      icon: 'Activity',
      title: 'Opérations',
      description: 'File d\'attente et historique',
      badge: stats.activeOps > 0 ? `${stats.activeOps} en cours` : null
    },
    {
      to: '/admin-console/activity',
      icon: 'Clock',
      title: 'Activité',
      description: 'Logs et historique des actions',
      badge: null
    },
    {
      to: '/admin-console/data-quality',
      icon: 'Database',
      title: 'Data Quality',
      description: 'Checks et validations',
      badge: alerts.length > 0 ? `${alerts.length}` : null
    }
  ], [stats, alerts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userRole={currentRole || 'super_admin'}
        currentTenant={{ name: 'Admin Console' }}
      />

      <main className={`transition-all duration-200 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        <PageHeader
          title="Admin Console"
          subtitle="Administration multi-sociétés et monitoring"
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-8">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="Building2"
              label="Entreprises"
              value={stats.companies}
              sub="Sociétés actives"
              color="primary"
            />
            <StatCard
              icon="Users"
              label="Utilisateurs"
              value={stats.users}
              sub="Toutes sociétés"
              color="success"
            />
            <StatCard
              icon="Activity"
              label="Opérations"
              value={stats.activeOps}
              sub="En cours d'exécution"
              color="warning"
            />
            <StatCard
              icon="AlertTriangle"
              label="Alertes"
              value={alerts.length}
              sub="Requièrent attention"
              color="error"
            />
          </div>

          {/* Navigation Grid */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Navigation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {navItems.map((item) => (
                <NavCard key={item.to} {...item} />
              ))}
            </div>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                ⚠️ Alertes
              </h2>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <AlertCard key={idx} {...alert} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminConsole;

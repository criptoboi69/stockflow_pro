import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import AuditTimeline from './components/AuditTimeline';
import AuditFilters from './components/AuditFilters';
import AuditStats from './components/AuditStats';
import { useAuth } from '../../contexts/AuthContext';
import auditLogService from '../../services/auditLogService';

const AuditTrail = () => {
  const navigate = useNavigate();
  const { currentCompany, currentRole, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    actionType: '',
    entityType: '',
    userId: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (currentCompany?.id) {
      loadAuditLogs();
      loadStats();
    }
  }, [currentCompany, user, navigate]);

  const loadAuditLogs = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const data = await auditLogService?.getAuditLogs(currentCompany?.id);
      setAuditLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentCompany?.id) return;

    try {
      const statsData = await auditLogService?.getAuditLogStats(currentCompany?.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, auditLogs]);

  const applyFilters = () => {
    let filtered = [...auditLogs];

    if (filters?.search) {
      const searchLower = filters?.search?.toLowerCase();
      filtered = filtered?.filter(log =>
        log?.description?.toLowerCase()?.includes(searchLower) ||
        log?.entityName?.toLowerCase()?.includes(searchLower) ||
        log?.user?.fullName?.toLowerCase()?.includes(searchLower)
      );
    }

    if (filters?.actionType) {
      filtered = filtered?.filter(log => log?.actionType === filters?.actionType);
    }

    if (filters?.entityType) {
      filtered = filtered?.filter(log => log?.entityType === filters?.entityType);
    }

    if (filters?.userId) {
      filtered = filtered?.filter(log => log?.userId === filters?.userId);
    }

    if (filters?.dateFrom) {
      filtered = filtered?.filter(log => new Date(log?.createdAt) >= new Date(filters?.dateFrom));
    }

    if (filters?.dateTo) {
      const endDate = new Date(filters?.dateTo);
      endDate?.setHours(23, 59, 59, 999);
      filtered = filtered?.filter(log => new Date(log?.createdAt) <= endDate);
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    // Export audit logs to CSV
    const csvContent = [
      ['Date', 'Utilisateur', 'Action', 'Entité', 'Description'],
      ...filteredLogs?.map(log => [
        new Date(log?.createdAt)?.toLocaleString('fr-FR'),
        log?.user?.fullName || 'Système',
        log?.actionType,
        log?.entityType,
        log?.description
      ])
    ]?.map(row => row?.join(','))?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-trail-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    link?.click();
  };

  const quickActions = [
    {
      id: 'export',
      label: 'Exporter',
      icon: 'Download',
      onClick: handleExport,
      variant: 'outline'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: 'RefreshCw',
      onClick: loadAuditLogs,
      variant: 'outline'
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <QuickActionBar
          title="Journal d'audit"
          subtitle={`${filteredLogs?.length} entrée${filteredLogs?.length !== 1 ? 's' : ''}`}
          actions={quickActions}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Section */}
            {stats && (
              <AuditStats
                stats={stats}
                loading={loading}
              />
            )}

            {/* Filters Section */}
            <AuditFilters
              onFilterChange={handleFilterChange}
              onExport={handleExport}
              totalLogs={filteredLogs?.length}
              companyId={currentCompany?.id}
            />

            {/* Timeline Section */}
            <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">
                  Historique des activités
                </h2>
                <div className="text-sm text-text-muted">
                  {filteredLogs?.length} entrée{filteredLogs?.length !== 1 ? 's' : ''}
                </div>
              </div>

              <AuditTimeline
                logs={filteredLogs}
                isLoading={loading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuditTrail;
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const ActivityRow = ({ activity }) => {
  const actionConfig = {
    INSERT: { color: 'text-success', icon: 'Plus' },
    UPDATE: { color: 'text-primary', icon: 'Edit' },
    DELETE: { color: 'text-error', icon: 'Trash2' },
  };

  const action = actionConfig[activity?.action] || actionConfig.UPDATE;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted ${action.color}`}>
        <Icon name={action.icon} size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">
            {activity?.action} • {activity?.table_name}
          </p>
          <span className="text-xs text-text-muted">
            {new Date(activity?.created_at)?.toLocaleString('fr-FR')}
          </span>
        </div>
        <p className="text-sm text-text-muted mt-1">
          Company: {activity?.company_name || 'N/A'}
        </p>
        {activity?.description && (
          <p className="text-xs text-text-muted mt-2">{activity?.description}</p>
        )}
      </div>
    </div>
  );
};

const ActivityLog = () => {
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getActivityLog();
        setActivities(data);
      } catch (error) {
        logger.error('Activity log load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivity();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesCompany = companyFilter === 'all' || activity.company_id === companyFilter;
    const matchesType = typeFilter === 'all' || activity.action === typeFilter;
    return matchesCompany && matchesType;
  });

  const companyOptions = [
    { value: 'all', label: 'Toutes les entreprises' },
    ...[...new Set(activities.map(a => a.company_id))].map(id => ({
      value: id,
      label: activities.find(a => a.company_id === id)?.company_name || id
    }))
  ];

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'INSERT', label: 'Création' },
    { value: 'UPDATE', label: 'Modification' },
    { value: 'DELETE', label: 'Suppression' },
  ];

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
      <PageHeader
        title="Activité"
        subtitle="Historique des actions et logs système"
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select
              options={companyOptions}
              value={companyFilter}
              onChange={setCompanyFilter}
              placeholder="Filtrer par entreprise"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Type d'action"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Total</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{activities.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Créations</p>
            <p className="text-2xl font-bold text-success mt-1">{activities.filter(a => a.action === 'INSERT').length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Modifications</p>
            <p className="text-2xl font-bold text-primary mt-1">{activities.filter(a => a.action === 'UPDATE').length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Suppressions</p>
            <p className="text-2xl font-bold text-error mt-1">{activities.filter(a => a.action === 'DELETE').length}</p>
          </div>
        </div>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Clock" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium">Aucune activité</p>
            <p className="text-sm text-text-muted mt-1">Les actions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <ActivityRow key={activity?.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Icon from '../../../components/AppIcon';

const OperationRow = ({ operation }) => {
  const statusConfig = {
    pending: { color: 'bg-warning/10 text-warning border-warning/20', label: 'En attente' },
    processing: { color: 'bg-primary/10 text-primary border-primary/20', label: 'En cours' },
    completed: { color: 'bg-success/10 text-success border-success/20', label: 'Terminé' },
    failed: { color: 'bg-error/10 text-error border-error/20', label: 'Échoué' },
  };

  const status = statusConfig[operation?.status] || statusConfig.pending;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="Activity" size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{operation?.type}</p>
          <p className="text-xs text-text-muted">
            {operation?.company_name} • {new Date(operation?.created_at)?.toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
          {status.label}
        </span>
        <span className="text-sm text-text-muted">{operation?.progress || 0}%</span>
      </div>
    </div>
  );
};

const OperationsQueue = () => {
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoading(true);
        const data = await adminConsoleService.getOperationsQueue();
        setOperations(data);
      } catch (error) {
        logger.error('Operations queue load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOperations();
  }, []);

  const filteredOperations = operations.filter(op => 
    filter === 'all' || op.status === filter
  );

  const statusOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'failed', label: 'Échoué' },
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
        title="Opérations"
        subtitle="File d'attente et historique des opérations bulk"
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Total</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{operations.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">En cours</p>
            <p className="text-2xl font-bold text-primary mt-1">{operations.filter(o => o.status === 'processing').length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Terminé</p>
            <p className="text-2xl font-bold text-success mt-1">{operations.filter(o => o.status === 'completed').length}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-surface">
            <p className="text-sm text-text-muted">Échoué</p>
            <p className="text-2xl font-bold text-error mt-1">{operations.filter(o => o.status === 'failed').length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-surface text-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Operations List */}
        {filteredOperations.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Activity" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium">Aucune opération</p>
            <p className="text-sm text-text-muted mt-1">Les opérations apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOperations.map((op) => (
              <OperationRow key={op?.id} operation={op} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsQueue;

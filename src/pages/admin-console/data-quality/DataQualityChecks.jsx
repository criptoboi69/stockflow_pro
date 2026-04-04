import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';
import adminConsoleService from '../../../services/adminConsoleService';
import PageHeader from '../../../components/ui/PageHeader';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CheckCard = ({ check }) => {
  const statusConfig = {
    pass: { color: 'bg-success/10 text-success border-success/20', icon: 'CheckCircle', label: 'OK' },
    warning: { color: 'bg-warning/10 text-warning border-warning/20', icon: 'AlertTriangle', label: 'Attention' },
    error: { color: 'bg-error/10 text-error border-error/20', icon: 'AlertCircle', label: 'Erreur' },
  };

  const status = statusConfig[check?.status] || statusConfig.warning;

  return (
    <div className={`p-5 rounded-xl border ${status.color.split(' ')[2]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color}`}>
            <Icon name={status.icon} size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">{check?.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">{check?.description}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
          {status.label}
        </span>
      </div>
      
      {check?.details && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-text-muted">{check.details}</p>
        </div>
      )}
      
      {check?.affectedCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Icon name="AlertTriangle" size={16} className="text-warning" />
          <span className="text-text-muted">{check.affectedCount} élément(s) concerné(s)</span>
        </div>
      )}
    </div>
  );
};

const DataQualityChecks = () => {
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState({ pass: 0, warning: 0, error: 0 });

  const runChecks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminConsoleService.runDataQualityChecks();
      setChecks(data.checks);
      setSummary(data.summary);
    } catch (error) {
      logger.error('Data quality checks error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted">Exécution des checks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Data Quality"
        subtitle="Checks de qualité et validations des données"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={runChecks}
            iconName="RefreshCw"
            iconPosition="left"
          >
            Re-exécuter
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-success/20 bg-success/5">
            <div className="flex items-center gap-3">
              <Icon name="CheckCircle" size={24} className="text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{summary.pass}</p>
                <p className="text-xs text-text-muted">Checks OK</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-xl border border-warning/20 bg-warning/5">
            <div className="flex items-center gap-3">
              <Icon name="AlertTriangle" size={24} className="text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{summary.warning}</p>
                <p className="text-xs text-text-muted">Warnings</p>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-xl border border-error/20 bg-error/5">
            <div className="flex items-center gap-3">
              <Icon name="AlertCircle" size={24} className="text-error" />
              <div>
                <p className="text-2xl font-bold text-error">{summary.error}</p>
                <p className="text-xs text-text-muted">Erreurs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checks Grid */}
        {checks.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Database" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium">Aucun check exécuté</p>
            <p className="text-sm text-text-muted mt-1">Cliquez sur "Re-exécuter" pour lancer les checks</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checks.map((check, idx) => (
              <CheckCard key={idx} check={check} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataQualityChecks;

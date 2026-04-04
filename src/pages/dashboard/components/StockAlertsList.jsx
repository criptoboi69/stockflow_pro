import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StockAlertsList = ({ alerts, onViewAll, loading = false }) => {
  const navigate = useNavigate();
  const getAlertSeverity = (currentStock, minStock) => {
    if (currentStock === 0) return { level: 'critical', color: 'text-error', bg: 'bg-error/10' };
    if (currentStock <= minStock) return { level: 'warning', color: 'text-warning', bg: 'bg-warning/10' };
    return { level: 'normal', color: 'text-success', bg: 'bg-success/10' };
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      default:
        return 'CheckCircle';
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Alertes de Stock</h3>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-primary hover:text-primary/80"
          >
            Voir tout
            <Icon name="ArrowRight" size={16} className="ml-1" />
          </Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)]?.map((_, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-xl">
              <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
              <div className="w-16 h-6 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {alerts?.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-3" />
              <p className="text-text-primary font-medium">Aucune alerte de stock</p>
              <p className="text-text-muted text-sm">Tous les produits sont bien approvisionnés</p>
            </div>
          ) : (
            alerts?.map((alert) => {
              const severity = getAlertSeverity(alert?.currentStock, alert?.minStock);
              
              return (
                <div 
                  key={alert?.id} 
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-hover hover:bg-muted/50 ${severity?.bg}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-surface ${severity?.color}`}>
                    <Icon name={getAlertIcon(severity?.level)} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-text-primary truncate">
                        {alert?.productName}
                      </h4>
                      <span className="text-xs text-text-muted">#{alert?.sku}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-text-muted">
                        Stock: {alert?.currentStock} / Min: {alert?.minStock}
                      </span>
                      <span className="text-xs text-text-muted">
                        {alert?.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${severity?.color}`}>
                      {alert?.currentStock === 0 ? 'Rupture' : 'Faible'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/products?id=${alert?.id}`)}
                      className="w-8 h-8 text-text-muted hover:text-text-primary"
                    >
                      <Icon name="ExternalLink" size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlertsList;
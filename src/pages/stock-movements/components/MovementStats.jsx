import React from 'react';
import Icon from '../../../components/AppIcon';

const MovementStats = ({ movements, dateRange }) => {
  const calculateStats = () => {
    const stats = {
      totalMovements: movements?.length,
      receipts: 0,
      issues: 0,
      adjustments: 0,
      transfers: 0,
      totalQuantityIn: 0,
      totalQuantityOut: 0
    };

    movements?.forEach(movement => {
      stats[movement.type + 's']++;
      
      if (movement?.type === 'receipt') {
        stats.totalQuantityIn += movement?.quantity;
      } else if (movement?.type === 'issue') {
        stats.totalQuantityOut += Math.abs(movement?.quantity);
      }
    });

    return stats;
  };

  const stats = calculateStats();

  const statCards = [
    {
      label: 'Total mouvements',
      value: stats?.totalMovements,
      icon: 'Activity',
      color: 'text-text-primary',
      bgColor: 'bg-muted'
    },
    {
      label: 'Réceptions',
      value: stats?.receipts,
      icon: 'ArrowDown',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Sorties',
      value: stats?.issues,
      icon: 'ArrowUp',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      label: 'Ajustements',
      value: stats?.adjustments,
      icon: 'Edit',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'Transferts',
      value: stats?.transfers,
      icon: 'ArrowLeftRight',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Statistiques des mouvements
          </h3>
          {dateRange && (
            <p className="text-sm text-text-muted mt-1">
              Période: {dateRange}
            </p>
          )}
        </div>
        <Icon name="BarChart3" size={24} className="text-text-muted" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statCards?.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`w-12 h-12 ${stat?.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <Icon name={stat?.icon} size={20} className={stat?.color} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stat?.value}</div>
            <div className="text-xs text-text-muted">{stat?.label}</div>
          </div>
        ))}
      </div>
      {stats?.totalMovements > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="TrendingUp" size={16} className="text-success" />
              <span className="text-sm font-medium text-text-primary">Entrées totales</span>
            </div>
            <span className="text-lg font-bold text-success">+{stats?.totalQuantityIn}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-error/5 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="TrendingDown" size={16} className="text-error" />
              <span className="text-sm font-medium text-text-primary">Sorties totales</span>
            </div>
            <span className="text-lg font-bold text-error">-{stats?.totalQuantityOut}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementStats;
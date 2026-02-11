import React from 'react';
import Icon from '../../../components/AppIcon';

const QuickStatsCard = ({ title, stats, loading = false }) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
      <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)]?.map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {stats?.map((stat, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center space-x-2">
                <Icon name={stat?.icon} size={16} className="text-text-muted" />
                <span className="text-sm text-text-muted">{stat?.label}</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-text-primary">{stat?.value}</span>
                {stat?.unit && (
                  <span className="text-sm text-text-muted">{stat?.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickStatsCard;
import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActivityTimeline = ({ title, activities, onViewAll, loading = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'stock_in':
        return { name: 'ArrowUp', color: 'text-success' };
      case 'stock_out':
        return { name: 'ArrowDown', color: 'text-error' };
      case 'adjustment':
        return { name: 'Edit', color: 'text-warning' };
      case 'scan':
        return { name: 'QrCode', color: 'text-accent' };
      case 'user_login':
        return { name: 'LogIn', color: 'text-primary' };
      case 'product_added':
        return { name: 'Plus', color: 'text-success' };
      case 'alert':
        return { name: 'AlertTriangle', color: 'text-warning' };
      default:
        return { name: 'Activity', color: 'text-text-muted' };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
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
        <div className="space-y-4">
          {[...Array(5)]?.map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activities?.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Activity" size={48} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Aucune activité récente</p>
            </div>
          ) : (
            activities?.map((activity, index) => {
              const iconConfig = getActivityIcon(activity?.type);
              
              return (
                <div key={activity?.id || index} className="flex items-start space-x-3 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted ${iconConfig?.color}`}>
                    <Icon name={iconConfig?.name} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                          {activity?.title}
                        </p>
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">
                          {activity?.description}
                        </p>
                        {activity?.user && (
                          <p className="text-xs text-text-muted mt-1">
                            par {activity?.user}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                        {formatTimeAgo(activity?.timestamp)}
                      </span>
                    </div>
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

export default ActivityTimeline;
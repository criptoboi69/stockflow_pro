import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const KPIWidget = ({ 
  title, 
  value, 
  trend, 
  trendValue, 
  icon, 
  color = 'primary',
  onClick,
  loading = false 
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'error':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return 'TrendingUp';
    if (trend === 'down') return 'TrendingDown';
    return 'Minus';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-error';
    return 'text-text-muted';
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 card-shadow transition-hover hover:shadow-lg">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${getColorClasses()}`}>
          <Icon name={icon} size={20} className="sm:size-6" />
        </div>
        {onClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="text-text-muted hover:text-text-primary touch-target w-8 h-8 sm:w-10 sm:h-10"
          >
            <Icon name="ExternalLink" size={14} className="sm:size-4" />
          </Button>
        )}
      </div>

      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-xs sm:text-sm font-medium text-text-muted leading-tight">{title}</h3>
        
        {loading ? (
          <div className="h-6 sm:h-8 bg-muted rounded animate-pulse" />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-baseline space-y-1 sm:space-y-0 sm:space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-text-primary leading-none">{value}</span>
            {trend && trendValue && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                <Icon name={getTrendIcon()} size={12} className="sm:size-3.5" />
                <span className="text-xs sm:text-sm font-medium">{trendValue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIWidget;
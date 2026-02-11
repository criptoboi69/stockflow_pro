import React from 'react';
import Icon from '../../../components/AppIcon';

const RateLimitIndicator = ({ currentUsage = 23, limit = 60 }) => {
  const percentage = (currentUsage / limit) * 100;
  
  const getStatusColor = () => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const statusColor = getStatusColor();

  return (
    <div className="bg-card rounded-lg border border-border p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon name="Zap" size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">API Rate Limit</span>
        </div>
        <span className="text-xs text-text-muted">
          {currentUsage}/{limit} requests
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            statusColor === 'error' ? 'bg-error' :
            statusColor === 'warning'? 'bg-warning' : 'bg-success'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className={`
          ${statusColor === 'error' ? 'text-error' :
            statusColor === 'warning'? 'text-warning' : 'text-success'
          }
        `}>
          {percentage >= 90 ? 'Near limit' :
           percentage >= 70 ? 'High usage': 'Normal usage'}
        </span>
        <span className="text-text-muted">
          Resets in 47 seconds
        </span>
      </div>
    </div>
  );
};

export default RateLimitIndicator;
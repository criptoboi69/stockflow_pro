import React from 'react';
import Icon from '../../../components/AppIcon';

const AuditTimeline = ({ logs, isLoading = false }) => {
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'user_login':
        return 'LogIn';
      case 'user_logout':
        return 'LogOut';
      case 'user_created': case'product_created': case'stock_movement_created': case'category_created': case'company_created':
        return 'Plus';
      case 'user_updated': case'product_updated': case'stock_movement_updated': case'category_updated': case'company_updated': case'settings_updated':
        return 'Edit';
      case 'user_deleted': case'product_deleted': case'stock_movement_deleted': case'category_deleted':
        return 'Trash2';
      case 'role_changed':
        return 'Shield';
      case 'data_imported':
        return 'Upload';
      case 'data_exported':
        return 'Download';
      case 'system_event':
        return 'Activity';
      default:
        return 'Circle';
    }
  };

  const getActionColor = (actionType) => {
    if (actionType?.includes('created') || actionType === 'user_login') {
      return 'text-success';
    }
    if (actionType?.includes('deleted')) {
      return 'text-error';
    }
    if (actionType?.includes('updated') || actionType === 'role_changed') {
      return 'text-warning';
    }
    if (actionType === 'user_logout') {
      return 'text-text-muted';
    }
    if (actionType?.includes('data_')) {
      return 'text-accent';
    }
    return 'text-primary';
  };

  const getActionBgColor = (actionType) => {
    if (actionType?.includes('created') || actionType === 'user_login') {
      return 'bg-success/10';
    }
    if (actionType?.includes('deleted')) {
      return 'bg-error/10';
    }
    if (actionType?.includes('updated') || actionType === 'role_changed') {
      return 'bg-warning/10';
    }
    if (actionType === 'user_logout') {
      return 'bg-muted';
    }
    if (actionType?.includes('data_')) {
      return 'bg-accent/10';
    }
    return 'bg-primary/10';
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
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return time?.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)]?.map((_, index) => (
          <div key={index} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-surface rounded-lg border border-border animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs?.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-lg border border-border">
        <Icon name="Activity" size={48} className="mx-auto text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Aucune activité trouvée</h3>
        <p className="text-text-muted">Aucune entrée d'audit ne correspond à vos filtres actuels.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {logs?.map((log, index) => (
        <div key={log?.id} className="relative">
          {/* Timeline connector */}
          {index < logs?.length - 1 && (
            <div className="absolute left-5 top-16 w-0.5 h-6 bg-border hidden sm:block"></div>
          )}
          
          <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-surface rounded-lg border border-border hover:border-primary/20 transition-colors">
            {/* Action icon */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${getActionBgColor(log?.actionType)}
            `}>
              <Icon 
                name={getActionIcon(log?.actionType)} 
                size={18} 
                className={getActionColor(log?.actionType)}
              />
            </div>

            {/* Log details */}
            <div className="flex-1 min-w-0">
              {/* Description */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <p className="font-medium text-text-primary text-sm sm:text-base break-words">
                  {log?.description}
                </p>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatTimeAgo(log?.createdAt)}
                </span>
              </div>

              {/* Entity info */}
              {log?.entityName && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-text-muted">
                    {log?.entityType}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {log?.entityName}
                  </span>
                </div>
              )}

              {/* User info */}
              <div className="flex items-center space-x-2 text-xs text-text-muted">
                <Icon name="User" size={14} />
                <span>
                  {log?.user?.fullName || 'Système'}
                </span>
                {log?.user?.email && (
                  <>
                    <span>•</span>
                    <span>{log?.user?.email}</span>
                  </>
                )}
              </div>

              {/* Metadata */}
              {log?.metadata && Object.keys(log?.metadata)?.length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-text-muted">
                  <details>
                    <summary className="cursor-pointer hover:text-text-primary">
                      Détails supplémentaires
                    </summary>
                    <pre className="mt-2 overflow-x-auto">
                      {JSON.stringify(log?.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTimeline;
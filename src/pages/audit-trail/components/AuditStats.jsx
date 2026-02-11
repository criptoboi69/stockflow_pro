import React from 'react';
import Icon from '../../../components/AppIcon';

const AuditStats = ({ stats, loading = false }) => {
  const getActionTypeLabel = (actionType) => {
    const labels = {
      user_login: 'Connexions',
      user_logout: 'Déconnexions',
      user_created: 'Utilisateurs créés',
      user_updated: 'Utilisateurs modifiés',
      user_deleted: 'Utilisateurs supprimés',
      role_changed: 'Rôles modifiés',
      product_created: 'Produits créés',
      product_updated: 'Produits modifiés',
      product_deleted: 'Produits supprimés',
      stock_movement_created: 'Mouvements créés',
      stock_movement_updated: 'Mouvements modifiés',
      stock_movement_deleted: 'Mouvements supprimés',
      category_created: 'Catégories créées',
      category_updated: 'Catégories modifiées',
      category_deleted: 'Catégories supprimées',
      settings_updated: 'Paramètres modifiés',
      data_imported: 'Imports',
      data_exported: 'Exports',
      system_event: 'Événements système'
    };
    return labels?.[actionType] || actionType;
  };

  const getActionTypeIcon = (actionType) => {
    if (actionType?.includes('created')) return 'Plus';
    if (actionType?.includes('updated')) return 'Edit';
    if (actionType?.includes('deleted')) return 'Trash2';
    if (actionType === 'user_login') return 'LogIn';
    if (actionType === 'user_logout') return 'LogOut';
    if (actionType === 'role_changed') return 'Shield';
    if (actionType === 'data_imported') return 'Upload';
    if (actionType === 'data_exported') return 'Download';
    return 'Activity';
  };

  const getActionTypeColor = (actionType) => {
    if (actionType?.includes('created') || actionType === 'user_login') return 'text-success';
    if (actionType?.includes('deleted')) return 'text-error';
    if (actionType?.includes('updated') || actionType === 'role_changed') return 'text-warning';
    if (actionType?.includes('data_')) return 'text-accent';
    return 'text-primary';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)]?.map((_, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Get top action types
  const topActionTypes = Object.entries(stats?.actionTypeCounts || {})
    ?.sort(([, a], [, b]) => b - a)
    ?.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Total logs card */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">Total des entrées</p>
            <p className="text-3xl font-bold text-primary">{stats?.totalLogs || 0}</p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Icon name="Activity" size={24} className="text-primary" />
          </div>
        </div>
      </div>

      {/* Top action types */}
      {topActionTypes?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">Actions principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topActionTypes?.map(([actionType, count]) => (
              <div 
                key={actionType}
                className="bg-card border border-border rounded-lg p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon 
                      name={getActionTypeIcon(actionType)} 
                      size={18} 
                      className={getActionTypeColor(actionType)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted truncate">
                      {getActionTypeLabel(actionType)}
                    </p>
                    <p className="text-lg font-semibold text-text-primary">
                      {count}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditStats;
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import auditLogService from '../../../services/auditLogService';

const AuditFilters = ({ 
  onFilterChange, 
  onExport,
  totalLogs = 0,
  companyId
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    actionType: '',
    entityType: '',
    userId: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (companyId) {
      loadUsers();
    }
  }, [companyId]);

  const loadUsers = async () => {
    try {
      const usersData = await auditLogService?.getAuditLogUsers(companyId);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const actionTypes = [
    { value: '', label: 'Tous les types d\'action' },
    { value: 'user_login', label: 'Connexion utilisateur' },
    { value: 'user_logout', label: 'Déconnexion utilisateur' },
    { value: 'user_created', label: 'Utilisateur créé' },
    { value: 'user_updated', label: 'Utilisateur modifié' },
    { value: 'user_deleted', label: 'Utilisateur supprimé' },
    { value: 'role_changed', label: 'Rôle modifié' },
    { value: 'product_created', label: 'Produit créé' },
    { value: 'product_updated', label: 'Produit modifié' },
    { value: 'product_deleted', label: 'Produit supprimé' },
    { value: 'stock_movement_created', label: 'Mouvement de stock créé' },
    { value: 'stock_movement_updated', label: 'Mouvement de stock modifié' },
    { value: 'stock_movement_deleted', label: 'Mouvement de stock supprimé' },
    { value: 'category_created', label: 'Catégorie créée' },
    { value: 'category_updated', label: 'Catégorie modifiée' },
    { value: 'category_deleted', label: 'Catégorie supprimée' },
    { value: 'settings_updated', label: 'Paramètres modifiés' },
    { value: 'data_imported', label: 'Données importées' },
    { value: 'data_exported', label: 'Données exportées' },
    { value: 'system_event', label: 'Événement système' }
  ];

  const entityTypes = [
    { value: '', label: 'Tous les types d\'entité' },
    { value: 'user', label: 'Utilisateur' },
    { value: 'product', label: 'Produit' },
    { value: 'stock_movement', label: 'Mouvement de stock' },
    { value: 'category', label: 'Catégorie' },
    { value: 'company', label: 'Entreprise' },
    { value: 'settings', label: 'Paramètres' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'system', label: 'Système' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      dateFrom: '',
      dateTo: '',
      actionType: '',
      entityType: '',
      userId: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      {/* Search and quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Rechercher par description, entité, utilisateur..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="Filter" size={16} className="mr-2" />
            Filtres avancés
            <Icon 
              name={isExpanded ? 'ChevronUp' : 'ChevronDown'} 
              size={16} 
              className="ml-2" 
            />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-text-muted hover:text-text-primary"
            >
              <Icon name="X" size={16} className="mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date de début
            </label>
            <Input
              type="date"
              value={filters?.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
              className="w-full"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Date de fin
            </label>
            <Input
              type="date"
              value={filters?.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
              className="w-full"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type d'action
            </label>
            <Select
              value={filters?.actionType}
              onChange={(e) => handleFilterChange('actionType', e?.target?.value)}
              options={actionTypes}
              className="w-full"
            />
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Type d'entité
            </label>
            <Select
              value={filters?.entityType}
              onChange={(e) => handleFilterChange('entityType', e?.target?.value)}
              options={entityTypes}
              className="w-full"
            />
          </div>

          {/* User Filter */}
          {users?.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Utilisateur
              </label>
              <Select
                value={filters?.userId}
                onChange={(e) => handleFilterChange('userId', e?.target?.value)}
                options={[
                  { value: '', label: 'Tous les utilisateurs' },
                  ...users?.map(user => ({
                    value: user?.id,
                    label: `${user?.fullName} (${user?.email})`
                  }))
                ]}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm text-text-muted">
          {totalLogs} entrée{totalLogs !== 1 ? 's' : ''} trouvée{totalLogs !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default AuditFilters;
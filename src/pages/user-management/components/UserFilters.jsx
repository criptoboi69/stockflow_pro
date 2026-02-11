import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const UserFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  currentUserRole 
}) => {
  const roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'MEMBRE', label: 'Membre' },
    { value: 'ADMIN_SOCIETE', label: 'Admin Société' },
    ...(currentUserRole === 'SUPER_ADMIN' ? [
      { value: 'SUPER_ADMIN', label: 'Super Admin' }
    ] : [])
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'pending', label: 'En attente' }
  ];

  const companyOptions = [
    { value: '', label: 'Toutes les sociétés' },
    { value: 'TechCorp Solutions', label: 'TechCorp Solutions' },
    { value: 'InnovateLab', label: 'InnovateLab' },
    { value: 'DataFlow Systems', label: 'DataFlow Systems' },
    { value: 'CloudTech Enterprises', label: 'CloudTech Enterprises' }
  ];

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center">
          <Icon name="Filter" size={20} className="mr-2" />
          Filtres
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={16} className="mr-2" />
            Effacer les filtres
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Rechercher par nom ou email..."
          value={filters?.search}
          onChange={(e) => onFilterChange('search', e?.target?.value)}
        />

        <Select
          placeholder="Filtrer par rôle"
          options={roleOptions}
          value={filters?.role}
          onChange={(value) => onFilterChange('role', value)}
        />

        <Select
          placeholder="Filtrer par statut"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />

        {currentUserRole === 'SUPER_ADMIN' && (
          <Select
            placeholder="Filtrer par société"
            options={companyOptions}
            value={filters?.company}
            onChange={(value) => onFilterChange('company', value)}
          />
        )}
      </div>
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2 text-sm text-text-muted">
            <Icon name="Info" size={16} />
            <span>
              Filtres actifs: {Object.entries(filters)?.filter(([_, value]) => value !== '')?.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;
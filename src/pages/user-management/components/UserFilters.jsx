import React from 'react';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import ListFilterBar from '../../../components/ui/ListFilterBar';

const UserFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  currentUserRole,
  resultCount = 0,
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

  const activeChips = [
    ...(filters?.search ? [{ key: 'search', label: filters.search, icon: 'Search', variant: 'primary', onRemove: () => onFilterChange('search', '') }] : []),
    ...(filters?.role ? [{ key: 'role', label: `Rôle : ${roleOptions.find((option) => option.value === filters.role)?.label || filters.role}`, onRemove: () => onFilterChange('role', '') }] : []),
    ...(filters?.status ? [{ key: 'status', label: `Statut : ${statusOptions.find((option) => option.value === filters.status)?.label || filters.status}`, onRemove: () => onFilterChange('status', '') }] : []),
    ...(filters?.company ? [{ key: 'company', label: `Société : ${filters.company}`, onRemove: () => onFilterChange('company', '') }] : []),
  ];

  return (
    <ListFilterBar
      search={filters?.search}
      onSearchChange={(value) => onFilterChange('search', value)}
      searchPlaceholder="Rechercher par nom ou email..."
      filters={
        <>
          <FilterDropdown
            label="Rôle"
            options={roleOptions.filter((option) => option.value !== '')}
            value={filters?.role}
            onChange={(value) => onFilterChange('role', value || '')}
            placeholder="Filtrer par rôle"
            buttonIcon="Shield"
            className="w-full md:min-w-[180px] md:w-auto"
          />

          <FilterDropdown
            label="Statut"
            options={statusOptions.filter((option) => option.value !== '')}
            value={filters?.status}
            onChange={(value) => onFilterChange('status', value || '')}
            placeholder="Filtrer par statut"
            buttonIcon="BadgeCheck"
            className="w-full md:min-w-[180px] md:w-auto"
          />

          {currentUserRole === 'SUPER_ADMIN' && (
            <FilterDropdown
              label="Société"
              options={companyOptions.filter((option) => option.value !== '')}
              value={filters?.company}
              onChange={(value) => onFilterChange('company', value || '')}
              placeholder="Filtrer par société"
              buttonIcon="Building2"
              className="w-full md:min-w-[220px] md:w-auto"
            />
          )}
        </>
      }
      onReset={hasActiveFilters ? onClearFilters : null}
      resultLabel={`${resultCount} utilisateur${resultCount > 1 ? 's' : ''}`}
      activeChips={activeChips}
      className="mb-6"
    />
  );
};

export default UserFilters;

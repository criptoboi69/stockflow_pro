import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const MovementFilters = ({ 
  onFilterChange, 
  onExport,
  totalMovements = 0,
  userRole 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    movementType: '',
    location: '',
    user: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const movementTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'receipt', label: 'Réception' },
    { value: 'issue', label: 'Sortie' },
    { value: 'adjustment', label: 'Ajustement' },
    { value: 'transfer', label: 'Transfert' }
  ];

  const locations = [
    { value: '', label: 'Tous les emplacements' },
    { value: 'warehouse-a', label: 'Entrepôt A' },
    { value: 'warehouse-b', label: 'Entrepôt B' },
    { value: 'store-front', label: 'Magasin' },
    { value: 'returns', label: 'Retours' }
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
      movementType: '',
      location: '',
      user: ''
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
            placeholder="Rechercher par produit, SKU, utilisateur..."
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
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Button>

          {['super_admin', 'company_admin']?.includes(userRole) && (
            <Button
              variant="outline"
              onClick={onExport}
              className="text-text-secondary hover:text-text-primary"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>
      {/* Expanded filters */}
      {isExpanded && (
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Date de début
              </label>
              <Input
                type="date"
                value={filters?.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Date de fin
              </label>
              <Input
                type="date"
                value={filters?.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Type de mouvement
              </label>
              <select
                value={filters?.movementType}
                onChange={(e) => handleFilterChange('movementType', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {movementTypes?.map(type => (
                  <option key={type?.value} value={type?.value}>
                    {type?.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Emplacement
              </label>
              <select
                value={filters?.location}
                onChange={(e) => handleFilterChange('location', e?.target?.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {locations?.map(location => (
                  <option key={location?.value} value={location?.value}>
                    {location?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="text-sm text-text-muted">
              {totalMovements} mouvement{totalMovements !== 1 ? 's' : ''} trouvé{totalMovements !== 1 ? 's' : ''}
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-text-secondary hover:text-text-primary"
              >
                <Icon name="X" size={16} className="mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovementFilters;
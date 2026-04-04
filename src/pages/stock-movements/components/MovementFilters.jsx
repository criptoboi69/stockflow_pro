import React, { useMemo, useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import ListFilterBar from '../../../components/ui/ListFilterBar';

const MovementFilters = ({
  onFilterChange,
  onExport,
  totalMovements = 0,
  userRole,
  locations = []
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
    movementType: '',
    location: ''
  });

  const movementTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'receipt', label: 'Réception' },
    { value: 'issue', label: 'Sortie' },
    { value: 'adjustment', label: 'Ajustement' },
    { value: 'transfer', label: 'Transfert' }
  ];

  const locationOptions = useMemo(() => ([
    { value: '', label: 'Tous les emplacements' },
    ...locations.map((location) => ({ value: location, label: location })),
  ]), [locations]);

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
      location: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters)?.some(value => value !== '');

  const activeChips = [
    ...(filters.search ? [{ key: 'search', label: filters.search, icon: 'Search', variant: 'primary', onRemove: () => handleFilterChange('search', '') }] : []),
    ...(filters.movementType ? [{ key: 'movementType', label: `Type : ${movementTypes.find((item) => item.value === filters.movementType)?.label || filters.movementType}`, onRemove: () => handleFilterChange('movementType', '') }] : []),
    ...(filters.location ? [{ key: 'location', label: `Emplacement : ${filters.location}`, onRemove: () => handleFilterChange('location', '') }] : []),
    ...(filters.dateFrom ? [{ key: 'dateFrom', label: `Du : ${filters.dateFrom}`, onRemove: () => handleFilterChange('dateFrom', '') }] : []),
    ...(filters.dateTo ? [{ key: 'dateTo', label: `Au : ${filters.dateTo}`, onRemove: () => handleFilterChange('dateTo', '') }] : []),
  ];

  return (
    <ListFilterBar
      searchInput={
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px]">
          <Input
            type="search"
            placeholder="Rechercher par produit, SKU, utilisateur..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
          <Input
            type="date"
            value={filters?.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e?.target?.value)}
          />
          <Input
            type="date"
            value={filters?.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e?.target?.value)}
          />
        </div>
      }
      filters={
        <>
          <FilterDropdown
            label="Type"
            options={movementTypes.filter((option) => option.value !== '')}
            value={filters?.movementType}
            onChange={(value) => handleFilterChange('movementType', value || '')}
            placeholder="Type de mouvement"
            buttonIcon="ArrowUpDown"
            className="w-full md:min-w-[180px] md:w-auto"
          />

          <FilterDropdown
            label="Emplacement"
            options={locationOptions.filter((option) => option.value !== '')}
            value={filters?.location}
            onChange={(value) => handleFilterChange('location', value || '')}
            placeholder="Emplacement"
            buttonIcon="MapPin"
            className="w-full md:min-w-[220px] md:w-auto"
          />
        </>
      }
      actions={['super_admin', 'administrator']?.includes(userRole) ? (
        <Button
          variant="outline"
          onClick={onExport}
          iconName="Download"
          iconPosition="left"
          className="text-sm rounded-xl"
        >
          Exporter
        </Button>
      ) : null}
      onReset={hasActiveFilters ? handleReset : null}
      resultLabel={`${totalMovements} mouvement${totalMovements !== 1 ? 's' : ''} trouvé${totalMovements !== 1 ? 's' : ''}`}
      activeChips={activeChips}
    />
  );
};

export default MovementFilters;

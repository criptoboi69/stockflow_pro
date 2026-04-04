import React from 'react';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import ListFilterBar from '../../../components/ui/ListFilterBar';
import ViewModeToggle from '../../../components/ui/ViewModeToggle';

const ProductFilters = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
  resultCount = 0,
  isLoading = false,
  viewMode,
  onViewModeChange,
  categoryOptions = [],
}) => {
  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'in_stock', label: 'En stock' },
    { value: 'low_stock', label: 'Stock faible' },
    { value: 'out_of_stock', label: 'Rupture de stock' }
  ];


  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedCategory !== 'all';

  const activeChips = [
    ...(searchQuery ? [{ key: 'search', label: searchQuery, icon: 'Search', variant: 'primary', onRemove: () => onSearchChange('') }] : []),
    ...(selectedStatus !== 'all' ? [{ key: 'status', label: `Statut : ${statusOptions.find((option) => option.value === selectedStatus)?.label || selectedStatus}`, onRemove: () => onStatusChange('all') }] : []),
    ...(selectedCategory !== 'all' ? [{ key: 'category', label: `Catégorie : ${categoryOptions.find((option) => option.value === selectedCategory)?.label || selectedCategory}`, onRemove: () => onCategoryChange('all') }] : []),
  ];

  return (
    <ListFilterBar
      search={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher par nom, SKU ou catégorie..."
      filters={
        <>
          <FilterDropdown
            label="Statut"
            options={statusOptions.filter((option) => option.value !== 'all')}
            value={selectedStatus === 'all' ? '' : selectedStatus}
            onChange={(value) => onStatusChange(value || 'all')}
            placeholder="Statut"
            buttonIcon="BadgeCheck"
            className="w-full md:min-w-[180px] md:w-auto"
          />

          <FilterDropdown
            label="Catégorie"
            options={categoryOptions.filter((option) => option.value !== 'all')}
            value={selectedCategory === 'all' ? '' : selectedCategory}
            onChange={(value) => onCategoryChange(value || 'all')}
            placeholder="Catégorie"
            buttonIcon="FolderTree"
            className="w-full md:min-w-[200px] md:w-auto"
          />

          {onViewModeChange && (
            <ViewModeToggle
              value={viewMode}
              onChange={onViewModeChange}
              options={[
                { value: 'list', icon: 'List', label: 'Vue liste' },
                { value: 'grid', icon: 'Grid3X3', label: 'Vue grille' },
              ]}
            />
          )}
        </>
      }
      onReset={hasActiveFilters ? onClearFilters : null}
      resultLabel={isLoading ? 'Chargement...' : `${resultCount} produit${resultCount !== 1 ? 's' : ''} trouvé${resultCount !== 1 ? 's' : ''}`}
      activeChips={activeChips}
      className="mb-6"
    />
  );
};

export default ProductFilters;

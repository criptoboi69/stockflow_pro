import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

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
  searchInputRef
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'in_stock', label: 'En stock' },
    { value: 'low_stock', label: 'Stock faible' },
    { value: 'out_of_stock', label: 'Rupture de stock' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'clothing', label: 'Vêtements' },
    { value: 'books', label: 'Livres' },
    { value: 'home_garden', label: 'Maison & Jardin' },
    { value: 'sports', label: 'Sports & Loisirs' },
    { value: 'beauty', label: 'Beauté & Santé' }
  ];

  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedCategory !== 'all';

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span className="flex items-center">
            <Icon name="Filter" size={16} className="mr-2" />
            Filtres {hasActiveFilters && '(actifs)'}
          </span>
          <Icon 
            name={isExpanded ? "ChevronUp" : "ChevronDown"} 
            size={16} 
          />
        </Button>
      </div>
      {/* Filter Controls */}
      <div className={`space-y-4 lg:space-y-0 lg:flex lg:items-end lg:space-x-4 ${!isExpanded ? 'hidden lg:flex' : ''}`}>
        {/* Search Input */}
        <div className="flex-1 lg:max-w-md">
          <Input
            ref={searchInputRef}
            data-search-input
            type="search"
            placeholder="Rechercher par nom, SKU ou catégorie..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e?.target?.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:w-48">
          <Select
            options={statusOptions}
            value={selectedStatus}
            onChange={onStatusChange}
            placeholder="Statut"
          />
        </div>

        {/* Category Filter */}
        <div className="lg:w-48">
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={onCategoryChange}
            placeholder="Catégorie"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="text-text-muted hover:text-text-primary"
          >
            <Icon name="X" size={16} className="mr-2" />
            Effacer
          </Button>
        )}
      </div>
      {/* Results Count */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <Icon name="Package" size={16} />
              <span>{resultCount} produit{resultCount !== 1 ? 's' : ''} trouvé{resultCount !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center space-x-1 text-xs">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-text-muted">Filtres actifs</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
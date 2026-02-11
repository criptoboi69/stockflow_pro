import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProductPagination = ({ 
  currentPage, 
  totalPages, 
  totalProducts, 
  pageSize, 
  onPageChange 
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range?.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots?.push(1, '...');
    } else {
      rangeWithDots?.push(1);
    }

    rangeWithDots?.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots?.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots?.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mt-6 pt-6 border-t border-border">
      {/* Results Info */}
      <div className="text-sm text-text-muted">
        Affichage de {startItem} à {endItem} sur {totalProducts} produits
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-1"
        >
          <Icon name="ChevronLeft" size={16} />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getVisiblePages()?.map((page, index) => {
            if (page === '...') {
              return (
                <span key={index} className="px-2 py-1 text-text-muted">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={index}
                variant={currentPage === page ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1"
        >
          <span className="hidden sm:inline">Suivant</span>
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ProductPagination;
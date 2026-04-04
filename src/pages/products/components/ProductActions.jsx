import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const ProductActions = ({ 
  viewMode, 
  onViewModeChange, 
  selectedProducts, 
  onBulkAction, 
  onAddProduct,
  totalProducts,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  userRole = 'user'
}) => {
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState(false);

  const canExport = ['super_admin', 'administrator']?.includes(userRole);

  const bulkActions = [
    ...(canExport ? [{ value: 'export', label: 'Exporter la sélection', icon: 'Download' }] : []),
    { value: 'delete', label: 'Supprimer la sélection', icon: 'Trash2', destructive: true },
    { value: 'update_category', label: 'Modifier la catégorie', icon: 'FolderTree' },
    { value: 'update_location', label: 'Modifier l\'emplacement', icon: 'MapPin' }
  ];

  const pageSizeOptions = [
    { value: '10', label: '10 par page' },
    { value: '25', label: '25 par page' },
    { value: '50', label: '50 par page' },
    { value: '100', label: '100 par page' }
  ];

  const handleBulkAction = (action) => {
    onBulkAction(action, selectedProducts);
    setBulkActionDropdownOpen(false);
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
      {/* Left Section - Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        {/* Bulk Actions */}
        {selectedProducts?.length > 0 && (
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
              className="w-full sm:w-auto"
            >
              <Icon name="MoreHorizontal" size={16} className="mr-2" />
              Actions ({selectedProducts?.length})
              <Icon name="ChevronDown" size={14} className="ml-2" />
            </Button>

            {bulkActionDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-lg modal-shadow z-50">
                <div className="p-2">
                  {bulkActions?.map((action) => (
                    <Button
                      key={action?.value}
                      variant="ghost"
                      onClick={() => handleBulkAction(action?.value)}
                      className={`w-full justify-start text-sm ${
                        action?.destructive 
                          ? 'text-error hover:text-error hover:bg-error/10' :'text-text-primary hover:bg-muted'
                      }`}
                    >
                      <Icon name={action?.icon} size={16} className="mr-2" />
                      {action?.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Right Section - View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        {/* Page Size Selector */}
        <div className="w-full sm:w-auto">
          <Select
            options={pageSizeOptions}
            value={pageSize?.toString()}
            onChange={(value) => onPageSizeChange(parseInt(value))}
          />
        </div>

      </div>
      {/* Click outside handler for bulk actions dropdown */}
      {bulkActionDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setBulkActionDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductActions;
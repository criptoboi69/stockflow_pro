import React from 'react';
import Icon from '../../../components/AppIcon';
import useCompanySettings from '../../../hooks/useCompanySettings';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { useAuth } from '../../../contexts/AuthContext';
import useResponsive from '../../../hooks/useResponsive';

const ProductTable = ({ 
  products, 
  selectedProducts, 
  onSelectProduct, 
  onSelectAll, 
  onEdit, 
  onView, 
  onGenerateQR, 
  onStockMovement,
  sortField,
  sortDirection,
  canUserEdit,
  onSort
}) => {
  const { canSeePrices } = useAuth();
  const { isMobile } = useResponsive();
  const { settings } = useCompanySettings();
  const showPrices = canSeePrices() && settings?.showPrices !== false;

  const getStatusBadge = (status, quantity) => {
    if (quantity === 0) {
      return {
        color: 'bg-error/10 text-error border-error/20',
        label: 'Rupture de stock',
        icon: 'AlertCircle'
      };
    } else if (quantity <= 10) {
      return {
        color: 'bg-warning/10 text-warning border-warning/20',
        label: 'Stock faible',
        icon: 'AlertTriangle'
      };
    } else {
      return {
        color: 'bg-success/10 text-success border-success/20',
        label: 'En stock',
        icon: 'CheckCircle'
      };
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      onSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return 'ArrowUpDown';
    return sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const isAllSelected = products?.length > 0 && selectedProducts?.length === products?.length;
  const isPartiallySelected = selectedProducts?.length > 0 && selectedProducts?.length < products?.length;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              {!isMobile && (
                <th className="w-12 p-4">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isPartiallySelected}
                    onChange={(e) => onSelectAll(e?.target?.checked)}
                  />
                </th>
              )}
              <th className="text-left p-4 font-medium text-text-primary">Image</th>
              <th className="text-left p-4 font-medium text-text-primary">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="p-0 h-auto font-medium hover:text-primary"
                >
                  Nom du produit
                  <Icon name={getSortIcon('name')} size={14} className="ml-1" />
                </Button>
              </th>
              {!isMobile && (
                <>
                  <th className="text-left p-4 font-medium text-text-primary">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('category')}
                      className="p-0 h-auto font-medium hover:text-primary"
                    >
                      Catégorie
                      <Icon name={getSortIcon('category')} size={14} className="ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium text-text-primary">Emplacement</th>
                </>
              )}
              {!isMobile && showPrices && (
                <th className="text-left p-4 font-medium text-text-primary">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('price')}
                    className="p-0 h-auto font-medium hover:text-primary"
                  >
                    Prix
                    <Icon name={getSortIcon('price')} size={14} className="ml-1" />
                  </Button>
                </th>
              )}
              <th className="text-left p-4 font-medium text-text-primary">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('quantity')}
                  className="p-0 h-auto font-medium hover:text-primary"
                >
                  Quantité
                  <Icon name={getSortIcon('quantity')} size={14} className="ml-1" />
                </Button>
              </th>
              <th className="text-left p-4 font-medium text-text-primary">Statut</th>
              <th className="text-right p-4 font-medium text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => {
              const statusBadge = getStatusBadge(product?.status, product?.quantity);
              const isSelected = selectedProducts?.includes(product?.id);

              return (
                <tr 
                  key={product?.id} 
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                >
                  {!isMobile && (
                    <td className="p-4">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => onSelectProduct(product?.id, e?.target?.checked)}
                      />
                    </td>
                  )}
                  <td className={isMobile ? 'p-3' : 'p-4'}>
                    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg overflow-hidden bg-muted`}>
                      <Image
                        src={product?.imageUrl || product?.imageUrls?.[0] || product?.image || '/assets/images/no_image.png'}
                        alt={`Image de ${product?.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className={`${isMobile ? 'p-3 min-w-[190px]' : 'p-4 min-w-[220px]'}`}>
                    <div>
                      <p className="font-medium text-text-primary">{product?.name}</p>
                      {isMobile ? (
                        <div className="mt-1 space-y-1 text-xs text-text-muted">
                          <div><span className="font-medium">Catégorie:</span> {product?.category || '—'}</div>
                          <div className="flex items-center space-x-1"><Icon name="MapPin" size={12} /><span>{product?.location || '—'}</span></div>
                        </div>
                      ) : (
                        product?.description && (
                          <p className="text-sm text-text-muted line-clamp-1">{product?.description}</p>
                        )
                      )}
                    </div>
                  </td>
                  {!isMobile && (
                    <>
                      <td className="p-4">
                        <span className="text-text-primary">{product?.category}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-text-muted">
                          <Icon name="MapPin" size={14} />
                          <span>{product?.location}</span>
                        </div>
                      </td>
                    </>
                  )}
                  {!isMobile && showPrices && (
                    <td className="p-4">
                      <span className="text-text-primary font-medium">
                        {product?.price ? `${product?.price} €` : '-'}
                      </span>
                    </td>
                  )}
                  <td className="p-4">
                    <span className={`font-bold ${
                      product?.quantity === 0 ? 'text-error' :
                      product?.quantity <= 10 ? 'text-warning' : 'text-success'
                    }`}>
                      {product?.quantity}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge?.color}`}>
                      <Icon name={statusBadge?.icon} size={12} />
                      <span>{statusBadge?.label}</span>
                    </div>
                  </td>
                  <td className={`${isMobile ? 'p-2' : 'p-4'}`}>
                    <div className={`flex items-center justify-end ${isMobile ? 'space-x-0.5' : 'space-x-1'}`}>
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon-sm" : "icon"}
                        onClick={() => onView(product)}
                        className={`text-text-muted hover:text-text-primary ${isMobile ? 'w-8 h-8' : ''}`}
                        title="Voir"
                      >
                        <Icon name="Eye" size={isMobile ? 14 : 16} />
                      </Button>
                      {canUserEdit && (
                        <Button
                          variant="ghost"
                          size={isMobile ? "icon-sm" : "icon"}
                          onClick={() => onEdit(product)}
                          className={`text-text-muted hover:text-text-primary ${isMobile ? 'w-8 h-8' : ''}`}
                          title="Modifier"
                        >
                          <Icon name="Edit" size={isMobile ? 14 : 16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon-sm" : "icon"}
                        onClick={() => onGenerateQR(product)}
                        className={`text-text-muted hover:text-text-primary ${isMobile ? 'w-8 h-8' : ''}`}
                        title="QR Code"
                      >
                        <Icon name="QrCode" size={isMobile ? 14 : 16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon-sm" : "icon"}
                        onClick={() => onStockMovement(product)}
                        className={`text-text-muted hover:text-text-primary ${isMobile ? 'w-8 h-8' : ''}`}
                        title="Mouvement"
                      >
                        <Icon name="ArrowUpDown" size={isMobile ? 14 : 16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {products?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="Package" size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Aucun produit trouvé</h3>
          <p className="text-text-muted">Essayez de modifier vos critères de recherche ou ajoutez un nouveau produit.</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
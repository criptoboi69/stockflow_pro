import React from 'react';
import Icon from '../../../components/AppIcon';
import useCompanySettings from '../../../hooks/useCompanySettings';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';

const ProductCard = ({ product, onEdit, onView, onGenerateQR, onStockMovement }) => {
  const { isAdministrator, isManager } = useAuth();
  const { settings } = useCompanySettings();
  const canSeePrices = isAdministrator() || isManager();
  const showPrices = canSeePrices && settings?.showPrices !== false;

  const getStatusBadge = (status, quantity) => {
    if (quantity === 0) {
      return {
        color: 'bg-error text-error-foreground',
        label: 'Rupture',
        icon: 'AlertCircle'
      };
    } else if (quantity <= 10) {
      return {
        color: 'bg-warning text-warning-foreground',
        label: 'Stock faible',
        icon: 'AlertTriangle'
      };
    } else {
      return {
        color: 'bg-success text-success-foreground',
        label: 'En stock',
        icon: 'CheckCircle'
      };
    }
  };

  const statusBadge = getStatusBadge(product?.status, product?.quantity);

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-hover card-shadow">
      {/* Product Image */}
      <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
        <Image
          src={product?.imageUrl || '/assets/images/no_image.png'}
          alt={`Image de ${product?.name}`}
          className="w-full h-full object-cover"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusBadge?.color}`}>
          <Icon name={statusBadge?.icon} size={12} />
          <span>{statusBadge?.label}</span>
        </div>

        {/* Quick Actions Overlay - visible on desktop hover, always visible on mobile */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 sm:transition-opacity flex items-center justify-center space-x-1 p-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView(product)}
            className="bg-surface text-text-primary hover:bg-muted p-2 min-w-[36px]"
          >
            <Icon name="Eye" size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(product)}
            className="bg-surface text-text-primary hover:bg-muted p-2 min-w-[36px]"
          >
            <Icon name="Edit" size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onGenerateQR(product)}
            className="bg-surface text-text-primary hover:bg-muted p-2 min-w-[36px]"
          >
            <Icon name="QrCode" size={16} />
          </Button>
        </div>
      </div>
      {/* Product Details */}
      <div className="p-3 sm:p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-text-primary mb-1 line-clamp-2 text-sm sm:text-base">
            {product?.name}
          </h3>
          <p className="text-xs text-text-muted">SKU: {product?.sku}</p>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Catégorie:</span>
            <span className="text-text-primary font-medium">{product?.category}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Emplacement:</span>
            <span className="text-text-primary font-medium">{product?.location}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Quantité:</span>
            <span className={`font-bold text-sm ${
              product?.quantity === 0 ? 'text-error' :
              product?.quantity <= 10 ? 'text-warning' : 'text-success'
            }`}>
              {product?.quantity}
            </span>
          </div>

          {/* Conditionally show price based on role */}
          {showPrices && product?.price && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Prix:</span>
              <span className="text-text-primary font-medium">{product?.price} €</span>
            </div>
          )}
        </div>

        {/* Action Buttons - stacked on mobile, row on desktop */}
        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-1.5 sm:space-y-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStockMovement(product)}
            className="w-full sm:flex-1 text-xs"
          >
            <Icon name="ArrowUpDown" size={14} className="mr-1" />
            Mouvement
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onView(product)}
            className="w-full sm:flex-1 text-xs"
          >
            <Icon name="Eye" size={14} className="mr-1" />
            Voir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
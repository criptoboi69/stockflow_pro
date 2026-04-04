import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const ScanResults = ({
  result,
  product,
  onClose,
  onScanAgain,
  currentLanguage = 'fr'
}) => {
  const navigate = useNavigate();

  const translations = {
    fr: {
      scanSuccess: "Scan réussi !",
      productFound: "Produit trouvé",
      productNotFound: "Produit non trouvé",
      viewDetails: "Voir les détails",
      scanAgain: "Scanner à nouveau",
      close: "Fermer",
      stockLevel: "Niveau de stock",
      category: "Catégorie",
      location: "Emplacement",
      lastUpdated: "Dernière mise à jour",
      inStock: "En stock",
      lowStock: "Stock faible",
      outOfStock: "Rupture de stock",
      sku: "SKU"
    },
    en: {
      scanSuccess: "Scan Successful!",
      productFound: "Product Found",
      productNotFound: "Product Not Found",
      viewDetails: "View Details",
      scanAgain: "Scan Again",
      close: "Close",
      stockLevel: "Stock Level",
      category: "Category",
      location: "Location",
      lastUpdated: "Last Updated",
      inStock: "In Stock",
      lowStock: "Low Stock",
      outOfStock: "Out of Stock",
      sku: "SKU"
    }
  };

  const t = translations?.[currentLanguage];

  // Use real product data if available, otherwise fallback to mock for demo
  const displayProduct = product || {
    id: result?.code || 'PRD-2024-001',
    name: result?.code === 'PRD-2024-001' ? 'Ordinateur Portable Dell XPS 13' :
    result?.code === 'PRD-2024-002' ? 'Souris Sans Fil Logitech MX Master 3' : 'Produit Scanné',
    sku: result?.code || 'PRD-2024-001',
    imageUrl: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf",
    category: 'Informatique',
    location: 'Entrepôt A - Étagère 3',
    quantity: 15,
    status: 'in_stock',
    updatedAt: new Date()
  };

  const getStockStatusInfo = (status, quantity) => {
    // Determine status from quantity if not provided
    const actualStatus = status || (quantity > 10 ? 'in_stock' : quantity > 0 ? 'low_stock' : 'out_of_stock');
    
    switch (actualStatus) {
      case 'in_stock':
        return {
          label: t?.inStock,
          color: 'text-success',
          bgColor: 'bg-success/10',
          icon: 'CheckCircle'
        };
      case 'low_stock':
        return {
          label: t?.lowStock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          icon: 'AlertTriangle'
        };
      case 'out_of_stock':
        return {
          label: t?.outOfStock,
          color: 'text-error',
          bgColor: 'bg-error/10',
          icon: 'XCircle'
        };
      default:
        return {
          label: t?.inStock,
          color: 'text-success',
          bgColor: 'bg-success/10',
          icon: 'CheckCircle'
        };
    }
  };

  const handleViewDetails = () => {
    navigate(`/products?search=${encodeURIComponent(displayProduct?.sku)}`);
  };

  if (!result) return null;

  const stockInfo = getStockStatusInfo(displayProduct?.status, displayProduct?.quantity);

  // Determine if product was found
  const productFound = result.success && product !== null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${productFound ? 'bg-success/10' : 'bg-error/10'}`}>
              <Icon name={productFound ? 'CheckCircle' : 'XCircle'} size={20} className={productFound ? 'text-success' : 'text-error'} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{productFound ? t?.scanSuccess : t?.productNotFound}</h3>
              <p className="text-sm text-text-muted">{productFound ? t?.productFound : `${t?.sku}: ${result?.code}`}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Product Information */}
        {productFound ? (
          <div className="p-6 space-y-6">
            {/* Product Image and Basic Info */}
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {displayProduct?.imageUrl ? (
                  <img 
                    src={displayProduct?.imageUrl} 
                    alt={displayProduct?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Package" size={32} className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary mb-1">{displayProduct?.name}</h4>
                <p className="text-sm text-text-muted mb-2">{t?.sku}: {displayProduct?.sku}</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${stockInfo?.bgColor} ${stockInfo?.color}`}>
                  <Icon name={stockInfo?.icon} size={12} className="mr-1" />
                  {stockInfo?.label}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.stockLevel}</p>
                <p className="font-medium text-text-primary">{displayProduct?.quantity} unités</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.category}</p>
                <p className="font-medium text-text-primary">{displayProduct?.category || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-muted mb-1">{t?.location}</p>
                <p className="font-medium text-text-primary">{displayProduct?.location || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-text-muted mb-1">{t?.lastUpdated}</p>
                <p className="font-medium text-text-primary">
                  {displayProduct?.updatedAt ? new Date(displayProduct.updatedAt).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <Icon name="PackageX" size={48} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">{t?.productNotFound}</p>
            <p className="text-sm text-text-muted mt-2">{t?.sku}: {result?.code}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-border">
          {productFound ? (
            <Button onClick={handleViewDetails} className="flex-1">
              <Icon name="Eye" size={16} className="mr-2" />
              {t?.viewDetails}
            </Button>
          ) : null}
          <Button onClick={onScanAgain} variant={productFound ? "outline" : "default"} className="flex-1">
            <Icon name="QrCode" size={16} className="mr-2" />
            {t?.scanAgain}
          </Button>
        </div>
      </div>
    </div>);

};

export default ScanResults;
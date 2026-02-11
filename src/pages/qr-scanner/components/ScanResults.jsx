import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const ScanResults = ({
  result,
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
      outOfStock: "Rupture de stock"
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
      outOfStock: "Out of Stock"
    }
  };

  const t = translations?.[currentLanguage];

  // Mock product data based on scan result
  const mockProduct = {
    id: result?.code || 'PRD-2024-001',
    name: result?.code === 'PRD-2024-001' ? 'Ordinateur Portable Dell XPS 13' :
    result?.code === 'PRD-2024-002' ? 'Souris Sans Fil Logitech MX Master 3' : 'Produit Scanné',
    sku: result?.code || 'PRD-2024-001',
    image: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf",
    imageAlt: 'Modern silver laptop computer open on white desk with clean minimalist design',
    category: 'Informatique',
    location: 'Entrepôt A - Étagère 3',
    stockQuantity: 15,
    stockStatus: 'in_stock',
    lastUpdated: new Date()?.toLocaleDateString('fr-FR'),
    found: true
  };

  const getStockStatusInfo = (status, quantity) => {
    switch (status) {
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
    navigate(`/products/${mockProduct?.id}`);
  };

  if (!result) return null;

  const stockInfo = getStockStatusInfo(mockProduct?.stockStatus, mockProduct?.stockQuantity);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name="CheckCircle" size={20} className="text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{t?.scanSuccess}</h3>
              <p className="text-sm text-text-muted">{t?.productFound}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Product Information */}
        <div className="p-6 space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={mockProduct?.image}
                alt={mockProduct?.imageAlt}
                className="w-full h-full object-cover" />

            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-primary mb-1">{mockProduct?.name}</h4>
              <p className="text-sm text-text-muted mb-2">SKU: {mockProduct?.sku}</p>
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
              <p className="font-medium text-text-primary">{mockProduct?.stockQuantity} unités</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">{t?.category}</p>
              <p className="font-medium text-text-primary">{mockProduct?.category}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-text-muted mb-1">{t?.location}</p>
              <p className="font-medium text-text-primary">{mockProduct?.location}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-text-muted mb-1">{t?.lastUpdated}</p>
              <p className="font-medium text-text-primary">{mockProduct?.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-border">
          <Button onClick={handleViewDetails} className="flex-1">
            <Icon name="Eye" size={16} className="mr-2" />
            {t?.viewDetails}
          </Button>
          <Button onClick={onScanAgain} variant="outline" className="flex-1">
            <Icon name="QrCode" size={16} className="mr-2" />
            {t?.scanAgain}
          </Button>
        </div>
      </div>
    </div>);

};

export default ScanResults;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ScanResults = ({ result, onClose, onScanAgain, currentLanguage = 'fr' }) => {
  const navigate = useNavigate();

  const translations = {
    fr: {
      scanSuccess: 'Scan réussi !',
      productFound: 'Produit trouvé dans votre inventaire',
      productNotFound: 'Aucun produit trouvé',
      viewDetails: 'Voir détails',
      scanAgain: 'Scanner à nouveau',
      close: 'Fermer',
      stockStatus: 'État du stock',
      quantity: 'Quantité',
      category: 'Catégorie',
      location: 'Emplacement',
      lastUpdated: 'Dernière mise à jour',
      unknown: 'Inconnu'
    },
    en: {
      scanSuccess: 'Scan Successful!',
      productFound: 'Product found in your inventory',
      productNotFound: 'No product found',
      viewDetails: 'View Details',
      scanAgain: 'Scan Again',
      close: 'Close',
      stockStatus: 'Stock Status',
      quantity: 'Quantity',
      category: 'Category',
      location: 'Location',
      lastUpdated: 'Last Updated',
      unknown: 'Unknown'
    }
  };

  const t = translations?.[currentLanguage];
  const product = result?.product;

  const getStockStatusInfo = (quantity = 0) => {
    if (quantity <= 0) {
      return { label: 'Rupture', color: 'text-error', bgColor: 'bg-error/10', icon: 'XCircle' };
    }
    if (quantity <= 10) {
      return { label: 'Stock faible', color: 'text-warning', bgColor: 'bg-warning/10', icon: 'AlertTriangle' };
    }
    return { label: 'En stock', color: 'text-success', bgColor: 'bg-success/10', icon: 'CheckCircle' };
  };

  const handleViewDetails = () => {
    if (!product?.sku) {
      onClose?.();
      return;
    }
    navigate(`/products?search=${encodeURIComponent(product.sku)}`);
  };

  if (!result) return null;

  const stockInfo = getStockStatusInfo(product?.quantity || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200 p-4">
      <div className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto modal-shadow">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${product ? 'bg-success/10' : 'bg-warning/10'}`}>
                <Icon name={product ? 'CheckCircle' : 'AlertCircle'} size={24} className={product ? 'text-success' : 'text-warning'} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{product ? t?.scanSuccess : t?.productNotFound}</h3>
                <p className="text-sm text-text-muted">{product ? t?.productFound : `${result?.code || ''}`}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-text-muted hover:text-text-primary">
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {product && (
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {product?.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Package" size={24} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary mb-1">{product?.name || t?.unknown}</h4>
                <p className="text-sm text-text-muted mb-2">SKU: {product?.sku || result?.code}</p>
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${stockInfo?.bgColor}`}>
                  <Icon name={stockInfo?.icon} size={12} className={stockInfo?.color} />
                  <span className={`text-xs font-medium ${stockInfo?.color}`}>{stockInfo?.label}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.quantity}</p>
                <p className="font-medium text-text-primary">{product?.quantity ?? 0} unités</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.category}</p>
                <p className="font-medium text-text-primary">{product?.category || t?.unknown}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.location}</p>
                <p className="font-medium text-text-primary">{product?.location || t?.unknown}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">{t?.lastUpdated}</p>
                <p className="font-medium text-text-primary">{new Date(product?.updatedAt || result?.timestamp).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onScanAgain} className="flex-1" iconName="RotateCcw" iconPosition="left">
              {t?.scanAgain}
            </Button>
            {product && (
              <Button variant="default" onClick={handleViewDetails} className="flex-1" iconName="ExternalLink" iconPosition="left">
                {t?.viewDetails}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResults;

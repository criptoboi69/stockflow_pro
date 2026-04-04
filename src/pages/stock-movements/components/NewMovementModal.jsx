import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import productService from '../../../services/productService';
import locationService from '../../../services/locationService';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

const NewMovementModal = ({ isOpen, onClose, onSave, userRole, initialProduct = null }) => {
  const { currentCompany } = useAuth();
  const [currentStep, setCurrentStep] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    reason: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const canCreate = ['super_admin', 'administrator', 'manager', 'user']?.includes(userRole);

  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(initialProduct ? 'details' : 'search');
    setSearchTerm(initialProduct?.name || initialProduct?.sku || '');
    setSelectedProduct(initialProduct || null);
    setFormData({ quantity: 0, reason: '', location: '' });
    setErrors({});

    const loadData = async () => {
      if (!currentCompany?.id) return;
      try {
        setIsLoadingProducts(true);
        const [productsData, locationsData] = await Promise.all([
          productService.getProducts(currentCompany.id),
          locationService.getLocations(currentCompany.id),
        ]);
        setProducts(productsData || []);
        setLocations(locationsData || []);
      } catch (error) {
        logger.error('Error loading movement modal data:', error);
        setErrors({ submit: 'Impossible de charger les produits ou emplacements.' });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadData();
  }, [isOpen, currentCompany?.id, initialProduct]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm?.trim()?.toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      product?.name?.toLowerCase()?.includes(term) ||
      product?.sku?.toLowerCase()?.includes(term) ||
      product?.category?.toLowerCase()?.includes(term),
    );
  }, [products, searchTerm]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentStep('details');
    setErrors({});
    setFormData((prev) => ({
      ...prev,
      quantity: 0,
      location: product?.location || '',
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleQuantityIncrement = () => {
    setFormData((prev) => ({ ...prev, quantity: Number(prev?.quantity || 0) + 1 }));
    if (errors?.quantity) setErrors((prev) => ({ ...prev, quantity: null }));
  };

  const handleQuantityDecrement = () => {
    setFormData((prev) => ({ ...prev, quantity: Number(prev?.quantity || 0) - 1 }));
    if (errors?.quantity) setErrors((prev) => ({ ...prev, quantity: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const quantity = Number(formData?.quantity || 0);
    const currentStock = Number(selectedProduct?.quantity || 0);

    if (!quantity || Number.isNaN(quantity)) {
      newErrors.quantity = 'Veuillez saisir une quantité différente de zéro';
    }

    if (quantity < 0 && Math.abs(quantity) > currentStock) {
      newErrors.quantity = `Stock insuffisant (disponible: ${currentStock})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const quantity = Number(formData?.quantity || 0);
      const selectedLocation = locations.find((loc) => loc?.name === formData?.location) || null;
      const currentStock = Number(selectedProduct?.quantity || 0);

      const movementData = {
        productId: selectedProduct?.id,
        type: quantity > 0 ? 'receipt' : 'issue',
        quantity,
        location: selectedLocation?.name || formData?.location || selectedProduct?.location || '',
        reason: formData?.reason?.trim() || null,
      };

      await onSave(movementData);
      onClose();
    } catch (error) {
      logger.error('Error creating movement:', error);
      setErrors({ submit: error?.message || 'Erreur lors de la création. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(initialProduct ? 'details' : 'search');
    setSearchTerm(initialProduct?.name || initialProduct?.sku || '');
    setSelectedProduct(initialProduct || null);
    setFormData({ quantity: 0, reason: '', location: '' });
    setErrors({});
    onClose();
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedProduct(null);
    setFormData({ quantity: 0, reason: '', location: '' });
    setErrors({});
  };

  if (!isOpen) return null;

  if (!canCreate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg border border-border max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="Lock" size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Accès restreint</h3>
            <p className="text-text-muted mb-4">
              Vous n'avez pas les permissions nécessaires pour créer des mouvements de stock.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">Fermer</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            {currentStep === 'details' && (
              <Button variant="ghost" size="icon" onClick={handleBackToSearch} className="text-text-muted hover:text-text-primary">
                <Icon name="ArrowLeft" size={20} />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {currentStep === 'search' ? 'Nouveau mouvement de stock' : 'Détails du mouvement'}
              </h2>
              <p className="text-text-muted text-sm mt-1">
                {currentStep === 'search' ? 'Recherchez et sélectionnez un produit' : 'Configurez les détails du mouvement'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-text-muted hover:text-text-primary">
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6">
          {currentStep === 'search' ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">Rechercher un produit</label>
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Nom du produit, SKU, catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e?.target?.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingProducts ? (
                  <div className="text-center py-12 text-text-muted">Chargement des produits...</div>
                ) : filteredProducts?.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Package" size={48} className="mx-auto text-text-muted mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {searchTerm ? 'Aucun produit trouvé' : 'Recherchez un produit'}
                    </h3>
                    <p className="text-text-muted">
                      {searchTerm ? 'Essayez avec un autre terme de recherche' : 'Utilisez la barre de recherche ci-dessus'}
                    </p>
                  </div>
                ) : (
                  filteredProducts?.map((product) => (
                    <div
                      key={product?.id}
                      onClick={() => handleProductSelect(product)}
                      className="flex items-center p-4 border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {product?.imageUrl ? (
                          <img src={product?.imageUrl} alt={product?.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="Package" size={24} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 ml-4 min-w-0">
                        <h4 className="font-medium text-text-primary truncate">{product?.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary mt-1">
                          <span>SKU: {product?.sku}</span>
                          <span>•</span>
                          <span>Stock: {product?.quantity ?? 0}</span>
                          {product?.location && (<><span>•</span><span>{product?.location}</span></>)}
                        </div>
                      </div>
                      <Icon name="ChevronRight" size={20} className="text-text-muted" />
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {selectedProduct && (
                <div className="p-4 border border-border rounded-lg bg-muted/50 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {selectedProduct?.imageUrl ? (
                        <img src={selectedProduct?.imageUrl} alt={selectedProduct?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="Package" size={24} className="text-text-muted" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{selectedProduct?.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                        <span>SKU: {selectedProduct?.sku}</span>
                        <span>•</span>
                        <span>Stock actuel: {selectedProduct?.quantity ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Quantité à ajouter/retirer <span className="text-error">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button type="button" variant="outline" size="icon" onClick={handleQuantityDecrement} className="h-10 w-10 flex-shrink-0">
                      <Icon name="Minus" size={20} />
                    </Button>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData?.quantity}
                      onChange={(e) => handleInputChange('quantity', Number(e?.target?.value || 0))}
                      className={`text-center text-lg font-semibold ${errors?.quantity ? 'border-error' : ''}`}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleQuantityIncrement} className="h-10 w-10 flex-shrink-0">
                      <Icon name="Plus" size={20} />
                    </Button>
                  </div>
                  {errors?.quantity && <p className="text-error text-sm mt-1">{errors?.quantity}</p>}
                  <div className="flex items-start space-x-2 mt-2 text-xs text-text-muted">
                    <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
                    <p>Nombre positif = Ajout au stock | Nombre négatif = Retrait du stock | Stock actuel: {selectedProduct?.quantity ?? 0}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Emplacement</label>
                  <select
                    value={formData?.location}
                    onChange={(e) => handleInputChange('location', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sélectionner un emplacement</option>
                    {locations.map((location) => (
                      <option key={location?.id} value={location?.name}>
                        {location?.code ? `${location.name} (${location.code})` : location?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Motif <span className="text-text-muted text-xs">(optionnel)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Décrivez le motif de ce mouvement (optionnel)..."
                    value={formData?.reason}
                    onChange={(e) => handleInputChange('reason', e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {errors?.submit && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                    <p className="text-error text-sm">{errors?.submit}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                  <Button type="button" variant="outline" onClick={handleBackToSearch} disabled={isSubmitting} className="w-full sm:w-auto">
                    <Icon name="ArrowLeft" size={16} className="mr-2" />
                    Changer de produit
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Icon name="Save" size={16} className="mr-2" />
                        Créer le mouvement
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMovementModal;

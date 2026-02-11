import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';


const NewMovementModal = ({ isOpen, onClose, onSave, userRole }) => {
  const [currentStep, setCurrentStep] = useState('search'); // 'search' | 'details'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 0,
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock products for search
  const mockProducts = [
    {
      id: 'prod-001',
      name: 'Ordinateur portable Dell XPS 13',
      sku: 'DELL-XPS13-001',
      image: "https://images.unsplash.com/photo-1494498902093-87f291949d17",
      imageAlt: 'Silver Dell XPS 13 laptop open on white desk showing screen',
      currentStock: 125,
      location: 'Entrepôt A'
    },
    {
      id: 'prod-002',
      name: 'Souris sans fil Logitech MX Master 3',
      sku: 'LOG-MX3-002',
      image: "https://images.unsplash.com/photo-1618499893452-942141785a2a",
      imageAlt: 'Black Logitech wireless mouse on white surface with ergonomic design',
      currentStock: 35,
      location: 'Magasin'
    },
    {
      id: 'prod-003',
      name: 'Écran Samsung 27" 4K',
      sku: 'SAM-27-4K-003',
      image: "https://images.unsplash.com/photo-1721023554007-e45b90b68edf",
      imageAlt: 'Large Samsung 4K monitor displaying colorful desktop on modern office desk',
      currentStock: 47,
      location: 'Entrepôt B'
    },
    {
      id: 'prod-004',
      name: 'Clavier mécanique Corsair K95',
      sku: 'COR-K95-004',
      image: "https://images.unsplash.com/photo-1679533662330-457ca8447e7d",
      imageAlt: 'Black mechanical gaming keyboard with RGB backlighting on dark surface',
      currentStock: 60,
      location: 'Entrepôt A'
    },
    {
      id: 'prod-005',
      name: 'Webcam Logitech C920 HD',
      sku: 'LOG-C920-005',
      image: "https://images.unsplash.com/photo-1698697406794-63dfa42a3cca",
      imageAlt: 'Black Logitech HD webcam mounted on computer monitor in office setting',
      currentStock: 140,
      location: 'Entrepôt B'
    }
  ];

  // Mock locations for selection
  const locations = [
    { id: 'warehouse-a', name: 'Entrepôt A' },
    { id: 'warehouse-b', name: 'Entrepôt B' },
    { id: 'store-front', name: 'Magasin' },
    { id: 'returns', name: 'Retours' }
  ];

  // Filter products based on search
  const filteredProducts = mockProducts?.filter((product) =>
    product?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    product?.sku?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setCurrentStep('search');
      setSearchTerm('');
      setSelectedProduct(null);
      setFormData({
        quantity: 0,
        reason: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentStep('details');
    // Pre-fill location if possible
    const defaultLocation = locations?.find(loc => 
      loc?.name?.toLowerCase() === product?.location?.toLowerCase()
    );
    if (defaultLocation) {
      setFormData(prev => ({ ...prev, location: defaultLocation?.id }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleQuantityIncrement = () => {
    setFormData(prev => ({ ...prev, quantity: prev?.quantity + 1 }));
    if (errors?.quantity) {
      setErrors(prev => ({ ...prev, quantity: null }));
    }
  };

  const handleQuantityDecrement = () => {
    setFormData(prev => ({ ...prev, quantity: prev?.quantity - 1 }));
    if (errors?.quantity) {
      setErrors(prev => ({ ...prev, quantity: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.quantity || formData?.quantity === 0) {
      newErrors.quantity = 'Veuillez saisir une quantité différente de zéro';
    }

    // Validate stock for negative quantities (removals)
    if (formData?.quantity < 0 && Math.abs(formData?.quantity) > selectedProduct?.currentStock) {
      newErrors.quantity = `Stock insuffisant (disponible: ${selectedProduct?.currentStock})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const movementData = {
        product: selectedProduct,
        type: formData?.quantity > 0 ? 'receipt' : 'issue',
        quantity: formData?.quantity,
        location: { id: selectedProduct?.location, name: selectedProduct?.location },
        reason: formData?.reason || 'Aucun motif spécifié',
        createdBy: 'current_user',
        createdAt: new Date()?.toISOString()
      };

      await onSave(movementData);
      
      onClose();
    } catch (error) {
      console.error('Error creating movement:', error);
      setErrors({ submit: 'Erreur lors de la création. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('search');
    setSearchTerm('');
    setSelectedProduct(null);
    setFormData({
      quantity: 0,
      reason: ''
    });
    setErrors({});
    onClose();
  };

  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedProduct(null);
    setFormData({
      quantity: 0,
      reason: ''
    });
    setErrors({});
  };

  if (!isOpen) return null;

  // Check permissions
  const canCreate = ['super_admin', 'administrator']?.includes(userRole);
  if (!canCreate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg border border-border max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="Lock" size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Accès restreint
            </h3>
            <p className="text-text-muted mb-4">
              Vous n'avez pas les permissions nécessaires pour créer des mouvements de stock.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            {currentStep === 'details' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToSearch}
                className="text-text-muted hover:text-text-primary"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {currentStep === 'search' ? 'Nouveau mouvement de stock' : 'Détails du mouvement'}
              </h2>
              <p className="text-text-muted text-sm mt-1">
                {currentStep === 'search' ?'Recherchez et sélectionnez un produit' :'Configurez les détails du mouvement'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'search' ? (
            <>
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Rechercher un produit
                </label>
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                  <Input
                    type="text"
                    placeholder="Nom du produit, SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e?.target?.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-3">
                {filteredProducts?.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Package" size={48} className="mx-auto text-text-muted mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {searchTerm ? 'Aucun produit trouvé' : 'Recherchez un produit'}
                    </h3>
                    <p className="text-text-muted">
                      {searchTerm 
                        ? 'Essayez avec un autre terme de recherche' :'Utilisez la barre de recherche ci-dessus'
                      }
                    </p>
                  </div>
                ) : (
                  filteredProducts?.map((product) => (
                    <div
                      key={product?.id}
                      onClick={() => handleProductSelect(product)}
                      className="flex items-center p-4 border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <img
                        src={product?.image}
                        alt={product?.imageAlt}
                        className="w-16 h-16 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 ml-4">
                        <h4 className="font-medium text-text-primary">{product?.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                          <span>SKU: {product?.sku}</span>
                          <span>•</span>
                          <span>Stock: {product?.currentStock}</span>
                          <span>•</span>
                          <span>{product?.location}</span>
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
              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="p-4 border border-border rounded-lg bg-muted/50 mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedProduct?.image}
                      alt={selectedProduct?.imageAlt}
                      className="w-16 h-16 rounded-lg object-cover bg-muted"
                    />
                    <div>
                      <h4 className="font-medium text-text-primary">{selectedProduct?.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-text-secondary">
                        <span>SKU: {selectedProduct?.sku}</span>
                        <span>•</span>
                        <span>Stock actuel: {selectedProduct?.currentStock}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Movement Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quantity with +/- buttons */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Quantité à ajouter/retirer <span className="text-error">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleQuantityDecrement}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <Icon name="Minus" size={20} />
                    </Button>
                    <Input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData?.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e?.target?.value) || 0)}
                      className={`text-center text-lg font-semibold ${errors?.quantity ? 'border-error' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleQuantityIncrement}
                      className="h-10 w-10 flex-shrink-0"
                    >
                      <Icon name="Plus" size={20} />
                    </Button>
                  </div>
                  {errors?.quantity && (
                    <p className="text-error text-sm mt-1">{errors?.quantity}</p>
                  )}
                  <div className="flex items-start space-x-2 mt-2 text-xs text-text-muted">
                    <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
                    <p>
                      Nombre positif = Ajout au stock | Nombre négatif = Retrait du stock | Stock actuel: {selectedProduct?.currentStock}
                    </p>
                  </div>
                </div>

                {/* Reason - Now Optional */}
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

                {/* Submit Error */}
                {errors?.submit && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-md">
                    <p className="text-error text-sm">{errors?.submit}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToSearch}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Icon name="ArrowLeft" size={16} className="mr-2" />
                    Changer de produit
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
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
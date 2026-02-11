import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import QRCodeGenerator from './QRCodeGenerator';
import ImageUpload from '../../../components/ui/ImageUpload';
import storageService from '../../../services/storageService';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  mode = 'view', // 'view', 'edit', 'add'
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    location: '',
    quantity: 0,
    price: '',
    imageUrl: '',
    imageFilePath: '',
    minStock: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categoryOptions = [
    { value: 'electronics', label: 'Électronique' },
    { value: 'clothing', label: 'Vêtements' },
    { value: 'books', label: 'Livres' },
    { value: 'home_garden', label: 'Maison & Jardin' },
    { value: 'sports', label: 'Sports & Loisirs' },
    { value: 'beauty', label: 'Beauté & Santé' }
  ];

  const locationOptions = [
    { value: 'warehouse_a', label: 'Entrepôt A' },
    { value: 'warehouse_b', label: 'Entrepôt B' },
    { value: 'store_front', label: 'Magasin principal' },
    { value: 'storage_room', label: 'Réserve' }
  ];

  useEffect(() => {
    if (product && (mode === 'view' || mode === 'edit')) {
      setFormData({
        name: product?.name || '',
        sku: product?.sku || '',
        description: product?.description || '',
        category: product?.category || '',
        location: product?.location || '',
        quantity: product?.quantity || 0,
        price: product?.price || '',
        imageUrl: product?.imageUrl || '',
        imageFilePath: product?.imageFilePath || '',
        minStock: product?.minStock || 10
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: '',
        location: '',
        quantity: 0,
        price: '',
        imageUrl: '',
        imageFilePath: '',
        minStock: 10
      });
    }
    setErrors({});
  }, [product, mode, isOpen]);

  // Generate automatic SKU based on product info
  const generateSKU = () => {
    if (!formData?.name || !formData?.category) {
      return;
    }

    try {
      // Create SKU pattern: CATEGORY-NAME-RANDOM
      const categoryPrefix = formData?.category?.toUpperCase()?.substring(0, 3) || 'PRD';
      const namePrefix = formData?.name
        ?.toUpperCase()
        ?.replace(/[^A-Z0-9]/g, '')
        ?.substring(0, 6) || 'ITEM';
      const randomSuffix = uuidv4()?.replace(/-/g, '')?.substring(0, 6)?.toUpperCase();
      
      const generatedSKU = `${categoryPrefix}-${namePrefix}-${randomSuffix}`;
      
      setFormData(prev => ({ ...prev, sku: generatedSKU }));
      
      // Clear SKU error if it exists
      if (errors?.sku) {
        setErrors(prev => ({ ...prev, sku: '' }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (!formData?.sku?.trim()) {
      newErrors.sku = 'Le SKU est requis';
    }
    
    if (!formData?.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (!formData?.location) {
      newErrors.location = 'L\'emplacement est requis';
    }
    
    if (formData?.quantity < 0) {
      newErrors.quantity = 'La quantité ne peut pas être négative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (quantity) => {
    if (quantity === 0) {
      return {
        color: 'bg-error/10 text-error border-error/20',
        label: 'Rupture de stock',
        icon: 'AlertCircle'
      };
    } else if (quantity <= formData?.minStock) {
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

  const handleGenerateQR = () => {
    if (formData?.name && formData?.sku) {
      setShowQRGenerator(true);
    }
  };

  const handleQRGenerated = (qrData, qrConfig) => {
    setShowQRGenerator(false);
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const productId = product?.id || `temp_${Date.now()}`;
      
      const { publicUrl, filePath } = await storageService?.uploadProductImage(file, productId);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: publicUrl,
        imageFilePath: filePath
      }));
      
      if (errors?.imageUrl) {
        setErrors(prev => ({ ...prev, imageUrl: '' }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setErrors(prev => ({ 
        ...prev, 
        imageUrl: 'Échec du téléchargement de l\'image. Veuillez réessayer.' 
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    try {
      if (formData?.imageFilePath) {
        await storageService?.deleteProductImage(formData?.imageFilePath);
      }
      
      setFormData(prev => ({
        ...prev,
        imageUrl: '',
        imageFilePath: ''
      }));
    } catch (error) {
      console.error('Image removal failed:', error);
    }
  };

  if (!isOpen) return null;

  const statusBadge = getStatusBadge(formData?.quantity);
  const isReadOnly = mode === 'view';
  const title = mode === 'add' ? 'Ajouter un produit' : mode === 'edit' ? 'Modifier le produit' : 'Détails du produit';
  
  // Modified conditions to always show features in add and edit modes
  const canGenerateQR = mode !== 'view' && (formData?.name || formData?.sku || mode === 'add');
  const canGenerateSKU = mode !== 'view' && mode !== 'view';
  const showQRSection = mode !== 'view'; // Always show QR section in add/edit modes
  const showSKUGenerator = mode !== 'view'; // Always show SKU generator in add/edit modes

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-200 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden modal-shadow">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
            <div className="flex items-center space-x-2">
              {/* QR Code Generation Button - Always show in add/edit modes */}
              {showQRSection && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateQR}
                  className="text-text-muted hover:text-text-primary"
                  title="Générer QR Code"
                  disabled={!formData?.name && !formData?.sku}
                >
                  <Icon name="QrCode" size={20} />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-text-muted hover:text-text-primary"
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <Input
                  label="Nom du produit"
                  type="text"
                  value={formData?.name}
                  onChange={(e) => handleInputChange('name', e?.target?.value)}
                  error={errors?.name}
                  disabled={isReadOnly}
                  required
                />

                <div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Input
                        label="SKU"
                        type="text"
                        value={formData?.sku}
                        onChange={(e) => handleInputChange('sku', e?.target?.value)}
                        error={errors?.sku}
                        disabled={isReadOnly}
                        required
                      />
                    </div>
                    {/* Always show SKU generator in add/edit modes */}
                    {showSKUGenerator && (
                      <Button
                        variant="outline"
                        onClick={generateSKU}
                        className="mb-1"
                        title="Générer automatiquement le SKU"
                        disabled={!formData?.name || !formData?.category}
                      >
                        <Icon name="RefreshCw" size={16} className="mr-2" />
                        Auto
                      </Button>
                    )}
                  </div>
                  {/* Always show helper text in add/edit modes */}
                  {showSKUGenerator && (
                    <p className="text-xs text-text-muted mt-1">
                      {!formData?.name || !formData?.category 
                        ? 'Remplissez le nom et la catégorie pour générer automatiquement le SKU' :'Le SKU sera généré automatiquement basé sur le nom et la catégorie'
                      }
                    </p>
                  )}
                </div>

                <Input
                  label="Description"
                  type="text"
                  value={formData?.description}
                  onChange={(e) => handleInputChange('description', e?.target?.value)}
                  disabled={isReadOnly}
                />

                <Select
                  label="Catégorie"
                  options={categoryOptions}
                  value={formData?.category}
                  onChange={(value) => handleInputChange('category', value)}
                  error={errors?.category}
                  disabled={isReadOnly}
                  required
                />

                <Select
                  label="Emplacement"
                  options={locationOptions}
                  value={formData?.location}
                  onChange={(value) => handleInputChange('location', value)}
                  error={errors?.location}
                  disabled={isReadOnly}
                  required
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Product Image */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Image du produit
                  </label>
                  <ImageUpload
                    onUpload={handleImageUpload}
                    currentImage={formData?.imageUrl}
                    onRemove={handleImageRemove}
                    disabled={isReadOnly || uploadingImage}
                  />
                  {errors?.imageUrl && (
                    <p className="text-sm text-destructive mt-1">{errors?.imageUrl}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Quantité"
                    type="number"
                    value={formData?.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e?.target?.value) || 0)}
                    error={errors?.quantity}
                    disabled={isReadOnly}
                    min="0"
                  />

                  <Input
                    label="Prix unitaire (€)"
                    type="number"
                    step="0.01"
                    value={formData?.price}
                    onChange={(e) => handleInputChange('price', e?.target?.value)}
                    error={errors?.price}
                    disabled={isReadOnly}
                  />
                </div>

                <Input
                  label="Stock minimum"
                  type="number"
                  value={formData?.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e?.target?.value) || 0)}
                  error={errors?.minStock}
                  disabled={isReadOnly}
                />

                {/* Status Badge */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Statut du stock
                  </label>
                  <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${statusBadge?.color}`}>
                    <Icon name={statusBadge?.icon} size={16} />
                    <span className="font-medium">{statusBadge?.label}</span>
                  </div>
                </div>

                {/* QR Code Generation Section - Always show in add/edit modes */}
                {showQRSection && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      QR Code Produit
                    </label>
                    <div className="bg-muted/50 rounded-lg p-4 border-2 border-dashed border-border">
                      <div className="text-center">
                        <Icon name="QrCode" size={32} className="mx-auto mb-2 text-text-muted" />
                        <p className="text-sm text-text-muted mb-1 font-medium">
                          QR Code pour gestion des stocks
                        </p>
                        <p className="text-xs text-text-secondary mb-3">
                          {!formData?.name && !formData?.sku 
                            ? 'Remplissez le nom et le SKU pour générer le QR Code' :'Accès direct à la page produit et gestion de quantité'
                          }
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleGenerateQR}
                          iconName="QrCode"
                          iconPosition="left"
                          className="w-full"
                          disabled={!formData?.name && !formData?.sku}
                        >
                          {!formData?.name && !formData?.sku ? 'Remplir les champs requis' : 'Créer QR Code'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <div className="flex items-center space-x-2">
              {showQRSection && (
                <Button
                  variant="ghost"
                  onClick={handleGenerateQR}
                  iconName="QrCode"
                  iconPosition="left"
                  className="text-sm"
                  disabled={!formData?.name && !formData?.sku}
                >
                  QR Code
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                {isReadOnly ? 'Fermer' : 'Annuler'}
              </Button>
              
              {!isReadOnly && (
                <Button
                  variant="default"
                  onClick={handleSave}
                  loading={isLoading}
                >
                  {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Generator Modal */}
      <QRCodeGenerator
        product={formData?.name || formData?.sku ? formData : null}
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
        onGenerate={handleQRGenerated}
      />
    </>
  );
};

export default ProductModal;
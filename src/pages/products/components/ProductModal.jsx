import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import QRCodeGenerator from './QRCodeGenerator';
import storageService from '../../../services/storageService';
import locationService from '../../../services/locationService';
import categoryService from '../../../services/categoryService';
import productService from '../../../services/productService';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product = null, 
  mode = 'view', // 'view', 'edit', 'add'
  onSave,
  onDelete,
  canDelete = false
}) => {
  const navigate = useNavigate();
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
    imageUrls: [],
    imageFilePaths: [],
    qrCode: '',
    minStock: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [pendingImagePreviews, setPendingImagePreviews] = useState([]);
  const [isMobileClient, setIsMobileClient] = useState(false);

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const { currentCompany } = useAuth();

  useEffect(() => {
    setIsMobileClient(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''));
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!currentCompany?.id) return;
      try {
        const [categoryData, locationData] = await Promise.all([
          categoryService.getCategories(currentCompany.id),
          locationService.getLocations(currentCompany.id)
        ]);
        setCategories(categoryData || []);
        setLocations(locationData || []);
      } catch (error) {
        logger.error('Error loading product metadata:', error);
        setCategories([]);
        setLocations([]);
      }
    };

    loadMetadata();
  }, [currentCompany?.id]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category?.name || '',
        label: category?.name || ''
      })),
    [categories]
  );

  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: location?.name || '',
        label: location?.code ? `${location.name} (${location.code})` : location?.name || '',
      })),
    [locations],
  );


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
        imageUrls: product?.imageUrls || (product?.imageUrl ? [product?.imageUrl] : []),
        imageFilePaths: product?.imageFilePaths || (product?.imageFilePath ? [product?.imageFilePath] : []),
        qrCode: product?.qrCode || '',
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
        imageUrls: [],
        imageFilePaths: [],
        qrCode: '',
        minStock: 10
      });
    }
    setPendingImageFiles([]);
    setPendingImagePreviews([]);
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

    // In edit mode, images are now persisted immediately on upload.
    // So we should not block save with the old generic upload warning.
    if (uploadingImage && mode !== 'edit') {
      setErrors(prev => ({ ...prev, imageUrl: 'Upload image encore en cours (vous pouvez réessayer dans quelques secondes).' }));
      return;
    }

    setIsLoading(true);
    try {
      let nextFormData = { ...formData };

      if (pendingImageFiles.length > 0) {
        setUploadingImage(true);
        const productId = product?.id || `temp_${Date.now()}`;
        const uploaded = [];
        for (const file of pendingImageFiles) {
          const { publicUrl, filePath } = await uploadWithTimeout(file, productId, 45000);
          if (publicUrl) uploaded.push({ publicUrl, filePath });
        }
        const existingUrls = Array.isArray(nextFormData?.imageUrls) ? nextFormData.imageUrls : [];
        const existingPaths = Array.isArray(nextFormData?.imageFilePaths) ? nextFormData.imageFilePaths : [];
        const nextUrls = [...existingUrls, ...uploaded.map(i => i.publicUrl)].slice(0, 5);
        const nextPaths = [...existingPaths, ...uploaded.map(i => i.filePath)].slice(0, 5);
        nextFormData = {
          ...nextFormData,
          imageUrl: nextUrls?.[0] || '',
          imageFilePath: nextPaths?.[0] || '',
          imageUrls: nextUrls,
          imageFilePaths: nextPaths
        };
      }

      if (mode === 'edit' && product?.id) {
        await productService.updateProduct(product.id, nextFormData);
        onClose();
        setTimeout(() => window.location.reload(), 150);
        return;
      }

      await onSave(nextFormData);
      onClose();
    } catch (error) {
      logger.error('Error saving product:', error);
      setErrors(prev => ({
        ...prev,
        submit: error?.message || 'Échec de l\'enregistrement du produit'
      }));
    } finally {
      setUploadingImage(false);
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

  const handleQRGenerated = async (qrData, qrConfig) => {
    try {
      if (product?.id) {
        await productService.updateProduct(product.id, { qrCode: qrData });
      }
      setFormData((prev) => ({
        ...prev,
        qrCode: qrData
      }));
      setShowQRGenerator(false);
    } catch (error) {
      console.error('Error saving QR code from modal:', error);
      setErrors((prev) => ({ ...prev, submit: error?.message || "Échec de l'enregistrement du QR code" }));
    }
  };

  const handleDeleteProduct = async () => {
    if (!product?.id || !onDelete || !canDelete) return;
    const ok = window.confirm('Supprimer ce produit ? Cette action est irréversible.');
    if (!ok) return;

    try {
      setIsLoading(true);
      await onDelete(product?.id, formData?.imageFilePath || product?.imageFilePath || null);
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrors(prev => ({ ...prev, submit: error?.message || 'Échec de la suppression du produit' }));
    } finally {
      setUploadingImage(false);
      setIsLoading(false);
    }
  };

  const uploadWithTimeout = async (file, productId, timeoutMs = 45000) => {
    return Promise.race([
      storageService?.uploadProductImage(file, productId),
      new Promise((_, reject) => setTimeout(() => {
        reject(new Error('Timeout upload image'));
      }, timeoutMs))
    ]);
  };

  const persistUploadedFilesToProduct = async (files) => {
    if (!product?.id || mode !== 'edit' || !files?.length) return false;

    setUploadingImage(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { publicUrl, filePath } = await uploadWithTimeout(file, product.id, 45000);
        if (publicUrl) uploaded.push({ publicUrl, filePath });
      }

      if (!uploaded.length) return false;

      const existingUrls = Array.isArray(formData?.imageUrls) ? formData.imageUrls : [];
      const existingPaths = Array.isArray(formData?.imageFilePaths) ? formData.imageFilePaths : [];
      const nextUrls = [...existingUrls, ...uploaded.map((i) => i.publicUrl)].slice(0, 5);
      const nextPaths = [...existingPaths, ...uploaded.map((i) => i.filePath)].slice(0, 5);

      await productService.updateProduct(product.id, {
        imageUrl: nextUrls?.[0] || '',
        imageFilePath: nextPaths?.[0] || '',
        imageUrls: nextUrls,
        imageFilePaths: nextPaths
      });

      setFormData((prev) => ({
        ...prev,
        imageUrl: nextUrls?.[0] || '',
        imageFilePath: nextPaths?.[0] || '',
        imageUrls: nextUrls,
        imageFilePaths: nextPaths
      }));
      return true;
    } catch (error) {
      logger.error('Direct product image persistence failed:', error);
      setErrors((prev) => ({ ...prev, imageUrl: error?.message || "Échec du téléchargement de l'image." }));
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setErrors(prev => ({ ...prev, imageUrl: '' }));
      const currentCount = [...(formData?.imageUrls || []), ...pendingImagePreviews].filter(Boolean).length;
      if (currentCount >= 5) return;

      if (mode === 'edit' && product?.id) {
        await persistUploadedFilesToProduct([file]);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPendingImageFiles(prev => [...prev, file].slice(0, 5));
      setPendingImagePreviews(prev => [...prev, previewUrl].slice(0, 5));
    } catch (error) {
      logger.error('Image local add failed:', error);
      setErrors(prev => ({ ...prev, imageUrl: error?.message || "Impossible d'ajouter la photo." }));
      throw error;
    }
  };

  const handleImageRemove = async () => {
    const ok = window.confirm('Supprimer cette photo ? Cette action est irréversible.');
    if (!ok) return;

    try {
      if (formData?.imageFilePath) {
        await storageService?.deleteProductImage(formData?.imageFilePath);
      }

      setFormData(prev => {
        const nextUrls = (prev?.imageUrls || []).slice(1);
        const nextPaths = (prev?.imageFilePaths || []).slice(1);
        return {
          ...prev,
          imageUrl: nextUrls?.[0] || '',
          imageFilePath: nextPaths?.[0] || '',
          imageUrls: nextUrls,
          imageFilePaths: nextPaths
        };
      });
    } catch (error) {
      console.error('Image removal failed:', error);
    }
  };


  const handleAdditionalImagesUpload = async (event) => {
    const files = Array.from(event?.target?.files || []);
    if (!files?.length) return;

    try {
      setErrors(prev => ({ ...prev, imageUrl: '' }));
      const currentCount = [...(formData?.imageUrls || []), ...pendingImagePreviews].filter(Boolean).length;
      const freeSlots = Math.max(0, 5 - currentCount);
      const accepted = files.slice(0, freeSlots);

      if (mode === 'edit' && product?.id) {
        await persistUploadedFilesToProduct(accepted);
        return;
      }

      const previews = accepted.map((file) => URL.createObjectURL(file));
      setPendingImageFiles(prev => [...prev, ...accepted].slice(0, 5));
      setPendingImagePreviews(prev => [...prev, ...previews].slice(0, 5));
    } catch (error) {
      console.error('Additional images local add failed:', error);
      setErrors(prev => ({ ...prev, imageUrl: error?.message || "Impossible d'ajouter les photos." }));
      throw error;
    } finally {
      if (event?.target) event.target.value = '';
    }
  };

  const handleRemoveAdditionalImage = async (index) => {
    const ok = window.confirm('Supprimer cette photo ? Cette action est irréversible.');
    if (!ok) return;

    const persistedCount = (formData?.imageUrls || []).length;
    if (index < persistedCount) {
      try {
        const targetPath = formData?.imageFilePaths?.[index];
        if (targetPath) await storageService?.deleteProductImage(targetPath);
        setFormData(prev => {
          const nextUrls = [...(prev?.imageUrls || [])];
          const nextPaths = [...(prev?.imageFilePaths || [])];
          nextUrls.splice(index, 1);
          nextPaths.splice(index, 1);
          return {
            ...prev,
            imageUrl: nextUrls?.[0] || '',
            imageFilePath: nextPaths?.[0] || '',
            imageUrls: nextUrls,
            imageFilePaths: nextPaths
          };
        });
      } catch (error) {
        console.error('Persisted image removal failed:', error);
      }
      return;
    }

    const pendingIndex = index - persistedCount;
    setPendingImagePreviews(prev => prev.filter((_, i) => i !== pendingIndex));
    setPendingImageFiles(prev => prev.filter((_, i) => i !== pendingIndex));
  };

  if (!isOpen) return null;

  const statusBadge = getStatusBadge(formData?.quantity);
  const isReadOnly = mode === 'view';
  const title = mode === 'add' ? 'Ajouter un produit' : mode === 'edit' ? 'Modifier le produit' : 'Détails du produit';
  
  const canGenerateQR = mode !== 'view' && !!product?.id && !!formData?.name && !!formData?.sku;
  const canGenerateSKU = mode !== 'view' && mode !== 'view';
  const showQRSection = mode !== 'view';
  const showSKUGenerator = mode !== 'view';
  const persistedImages = (formData?.imageUrls || []).length ? (formData?.imageUrls || []) : (formData?.imageUrl ? [formData.imageUrl] : []);
  const galleryImages = [...persistedImages, ...pendingImagePreviews].filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-200 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg sm:rounded-lg w-full max-w-2xl h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[92vh] overflow-hidden modal-shadow flex flex-col">
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
                  title={canGenerateQR ? (formData?.qrCode ? 'Régénérer le QR de gestion du stock' : 'Générer le QR de gestion du stock') : 'Enregistre d’abord le produit avec un nom et un SKU'}
                  disabled={!canGenerateQR}
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
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                  {!isReadOnly && isMobileClient && product?.id && (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        iconName="Camera"
                        iconPosition="left"
                        onClick={() => navigate(`/products/photo-upload?product=${product.id}`)}
                        className="w-full"
                      >
                        Prendre une photo
                      </Button>
                      <p className="text-xs text-text-muted">Flux mobile dédié pour ajouter une photo au produit.</p>
                    </div>
                  )}
                  {errors?.imageUrl && (
                    <div className="mt-2 rounded-md border border-error/20 bg-error/10 p-3 text-sm text-destructive">{errors?.imageUrl}</div>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted">Jusqu’à 5 photos par produit</p>
                      <span className="text-xs text-text-muted">{galleryImages.filter(Boolean).length}/5</span>
                    </div>

                    {!isReadOnly && !isMobileClient && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploadingImage || galleryImages.length >= 5}
                          onChange={handleAdditionalImagesUpload}
                          className="block w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-border file:bg-muted file:text-text-primary"
                        />
                      </div>
                    )}

                    {galleryImages.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {galleryImages.map((url, idx) => (
                          <button
                            key={`${url}-${idx}`}
                            type="button"
                            onClick={() => setLightboxIndex(idx)}
                            className="relative rounded-md overflow-hidden border border-border h-14"
                            title="Agrandir"
                          >
                            <Image src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveAdditionalImage(idx); }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shadow"
                                title="Supprimer la photo"
                              >
                                ×
                              </button>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-3 sm:p-6 border-t border-border bg-surface sticky bottom-0">
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {mode === 'edit' && canDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteProduct}
                  iconName="Trash2"
                  iconPosition="left"
                  loading={isLoading}
                >
                  Supprimer
                </Button>
              )}
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
          {errors?.submit && (
            <div className="px-6 pb-4 text-sm text-destructive">{errors.submit}</div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div className="fixed inset-0 z-[300] bg-black/85 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <Icon name="X" size={28} />
          </button>

          {galleryImages.length > 1 && (
            <button
              className="absolute left-4 text-white"
              onClick={() => setLightboxIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
            >
              <Icon name="ChevronLeft" size={32} />
            </button>
          )}

          <img
            src={galleryImages[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

          {galleryImages.length > 1 && (
            <button
              className="absolute right-4 text-white"
              onClick={() => setLightboxIndex((prev) => (prev + 1) % galleryImages.length)}
            >
              <Icon name="ChevronRight" size={32} />
            </button>
          )}
        </div>
      )}

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
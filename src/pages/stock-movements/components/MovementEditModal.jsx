import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';


const MovementEditModal = ({ isOpen, onClose, movement, onSave, userRole }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && movement) {
      // Pre-populate form with current movement data for correction
      setFormData({
        quantity: Math.abs(movement?.quantity)?.toString() || '',
        reason: `Correction du mouvement ${movement?.id} - ${movement?.reason}` || ''
      });
      setErrors({});
    }
  }, [isOpen, movement]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleQuantityChange = (delta) => {
    const currentQty = parseInt(formData?.quantity || 0);
    const newQty = Math.max(0, currentQty + delta);
    handleInputChange('quantity', newQty?.toString());
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate quantity is a whole number
    if (!formData?.quantity || isNaN(formData?.quantity) || parseInt(formData?.quantity) <= 0 || !Number.isInteger(parseFloat(formData?.quantity))) {
      newErrors.quantity = 'Veuillez saisir un nombre entier valide';
    }

    // MANDATORY: Reason field is required
    if (!formData?.reason?.trim()) {
      newErrors.reason = 'Le motif de correction est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Create correction movement data
      const correctionData = {
        originalMovementId: movement?.id,
        product: movement?.product,
        quantity: parseInt(formData?.quantity),
        reason: formData?.reason,
        correctionType: 'manual_adjustment',
        createdBy: 'current_user', // In real app, get from auth context
        createdAt: new Date()?.toISOString()
      };

      await onSave(correctionData);
      
      // Reset form
      setFormData({
        quantity: '',
        reason: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving correction:', error);
      setErrors({ submit: 'Erreur lors de la sauvegarde. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      quantity: '',
      reason: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  // Check permissions
  const canEdit = ['super_admin', 'company_admin']?.includes(userRole);
  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-lg border border-border max-w-md w-full p-6">
          <div className="text-center">
            <Icon name="Lock" size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Accès restreint
            </h3>
            <p className="text-text-muted mb-4">
              Vous n'avez pas les permissions nécessaires pour modifier les mouvements de stock.
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
      <div className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Corriger le mouvement de stock
            </h2>
            <p className="text-text-muted text-sm mt-1">
              Créer un ajustement pour corriger une erreur
            </p>
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

        {/* Movement Info */}
        {movement && (
          <div className="p-6 border-b border-border bg-muted/50">
            <h3 className="text-sm font-medium text-text-primary mb-3">Mouvement original</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Produit:</span>
                <p className="font-medium text-text-primary">{movement?.product?.name}</p>
              </div>
              <div>
                <span className="text-text-muted">SKU:</span>
                <p className="font-medium text-text-primary">{movement?.product?.sku}</p>
              </div>
              <div>
                <span className="text-text-muted">Quantité:</span>
                <p className={`font-medium ${movement?.quantity > 0 ? 'text-success' : 'text-error'}`}>
                  {movement?.quantity > 0 ? '+' : ''}{movement?.quantity}
                </p>
              </div>
              <div>
                <span className="text-text-muted">Emplacement:</span>
                <p className="font-medium text-text-primary">{movement?.location?.name}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-text-muted">Motif original:</span>
                <p className="font-medium text-text-primary">{movement?.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quantity with +/- Buttons */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Quantité à ajuster <span className="text-error">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={!formData?.quantity || parseInt(formData?.quantity) <= 1}
                className="h-12 w-12 flex-shrink-0"
              >
                <Icon name="Minus" size={20} />
              </Button>
              
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="Ex: 5"
                value={formData?.quantity}
                onChange={(e) => {
                  const value = e?.target?.value;
                  // Only allow whole numbers
                  if (value === '' || /^\d+$/?.test(value)) {
                    handleInputChange('quantity', value);
                  }
                }}
                className={`text-center text-lg font-semibold flex-1 ${errors?.quantity ? 'border-error' : ''}`}
              />
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-12 w-12 flex-shrink-0"
              >
                <Icon name="Plus" size={20} />
              </Button>
            </div>
            {errors?.quantity && (
              <p className="text-error text-sm mt-1">{errors?.quantity}</p>
            )}
            <p className="text-text-muted text-xs mt-1">
              Utilisez les boutons + et - ou saisissez directement un nombre entier
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Motif de la correction <span className="text-error">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Ex: Correction d'erreur de saisie, Remise en stock après retour client, Ajustement suite à inventaire physique..."
              value={formData?.reason}
              onChange={(e) => handleInputChange('reason', e?.target?.value)}
              className={`w-full px-3 py-2 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors?.reason ? 'border-error' : 'border-border'
              }`}
            />
            {errors?.reason && (
              <p className="text-error text-sm mt-1">{errors?.reason}</p>
            )}
            <p className="text-text-muted text-xs mt-1">
              ⚠️ Le motif est obligatoire pour toute modification de mouvement
            </p>
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
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Correction en cours...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Créer la correction
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info Note */}
        <div className="p-6 bg-muted/50 border-t border-border">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-text-muted">
              <p className="font-medium text-text-primary mb-1">À propos des corrections</p>
              <p>
                Cette action créera un nouveau mouvement d'ajustement qui sera visible dans l'historique. 
                Le mouvement original reste inchangé pour maintenir la traçabilité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementEditModal;
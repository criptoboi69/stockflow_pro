import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategoryDeleteModal = ({ 
  category, 
  categories, 
  onConfirm, 
  onClose, 
  isBulk = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasProducts = isBulk 
    ? categories?.some(cat => cat?.productCount > 0)
    : category?.productCount > 0;

  const getTitle = () => {
    if (isBulk) {
      return `Supprimer ${categories?.length} catégorie${categories?.length !== 1 ? 's' : ''}`;
    }
    return 'Supprimer la catégorie';
  };

  const getMessage = () => {
    if (hasProducts) {
      if (isBulk) {
        return `Certaines catégories sélectionnées contiennent des produits. Vous devez d'abord déplacer ou supprimer ces produits avant de pouvoir supprimer les catégories.`;
      }
      return `Cette catégorie contient ${category?.productCount} produit${category?.productCount !== 1 ? 's' : ''}. Vous devez d'abord déplacer ou supprimer ces produits avant de pouvoir supprimer la catégorie.`;
    }

    if (isBulk) {
      return `Êtes-vous sûr de vouloir supprimer ces ${categories?.length} catégorie${categories?.length !== 1 ? 's' : ''} ? Cette action est irréversible.`;
    }
    return `Êtes-vous sûr de vouloir supprimer la catégorie "${category?.name}" ? Cette action est irréversible.`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-200 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md modal-shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
              <Icon name="Trash2" size={16} className="text-error" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {getTitle()}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-text-primary mb-2">
                {getMessage()}
              </p>
              
              {hasProducts && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Icon name="Info" size={16} className="text-warning" />
                    <p className="text-sm text-warning font-medium">
                      Action requise avant suppression
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    Rendez-vous dans la section Produits pour gérer les articles associés.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleConfirm}
              loading={isLoading}
              disabled={hasProducts}
              iconName="Trash2"
              iconPosition="left"
            >
              {isBulk ? 'Supprimer les catégories' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeleteModal;
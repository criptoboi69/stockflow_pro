import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CategoryEditModal = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category?.name || '',
        description: category?.description || ''
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'Le nom de la catégorie est requis';
    } else if (formData?.name?.trim()?.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const updatedCategory = {
        ...category,
        name: formData?.name?.trim(),
        description: formData?.description?.trim() || null,
        updatedAt: new Date()?.toISOString()
      };
      
      await onSave(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-200 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md modal-shadow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Edit2" size={16} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Modifier la catégorie
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nom de la catégorie"
            type="text"
            placeholder="Nom de la catégorie"
            value={formData?.name}
            onChange={(e) => handleChange('name', e?.target?.value)}
            error={errors?.name}
            required
            disabled={isLoading}
          />
          
          <Input
            label="Description (optionnel)"
            type="text"
            placeholder="Description de la catégorie"
            value={formData?.description}
            onChange={(e) => handleChange('description', e?.target?.value)}
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              variant="default"
              loading={isLoading}
              iconName="Save"
              iconPosition="left"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;
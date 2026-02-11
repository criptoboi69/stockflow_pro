import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CategoryQuickAdd = ({ onAdd, isLoading = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!name?.trim()) {
      newErrors.name = 'Le nom de la catégorie est requis';
    } else if (name?.trim()?.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;
    
    const categoryData = {
      name: name?.trim(),
      description: description?.trim() || null
    };
    
    onAdd(categoryData);
    
    // Reset form
    setName('');
    setDescription('');
    setErrors({});
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
          <Icon name="Plus" size={16} className="text-success" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Ajouter une nouvelle catégorie</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input
            label="Nom de la catégorie"
            type="text"
            placeholder="Ex: Électronique, Vêtements..."
            value={name}
            onChange={(e) => setName(e?.target?.value)}
            error={errors?.name}
            required
            disabled={isLoading}
          />
          
          <Input
            label="Description (optionnel)"
            type="text"
            placeholder="Description de la catégorie"
            value={description}
            onChange={(e) => setDescription(e?.target?.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="default"
            loading={isLoading}
            iconName="Plus"
            iconPosition="left"
            disabled={!name?.trim() || isLoading}
          >
            Ajouter la catégorie
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryQuickAdd;
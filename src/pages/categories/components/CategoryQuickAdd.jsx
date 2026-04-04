import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { logger } from '../../../utils/logger';

const CategoryQuickAdd = ({ onAdd, isLoading = false, inlineButton = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setErrors({});
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onAdd({
        name: name?.trim(),
        description: description?.trim() || null,
      });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      logger.error('Error adding category:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error?.message || 'Échec de la création de la catégorie',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={inlineButton ? '' : 'mb-6 flex justify-end'}>
        <Button
          type="button"
          variant="default"
          iconName="Plus"
          iconPosition="left"
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
          size="sm"
          className="text-xs lg:text-sm"
        >
          Ajouter une catégorie
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl border border-border">
            <div className="flex items-center justify-between border-b border-border p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <Icon name="Plus" size={16} className="text-success" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Ajouter une catégorie</h2>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-text-secondary hover:text-text-primary"
              >
                <Icon name="X" size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nom de la catégorie"
                type="text"
                placeholder="Ex: Électronique, Vêtements..."
                value={name}
                onChange={(e) => setName(e?.target?.value)}
                error={errors?.name}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Description (optionnel)"
                type="text"
                placeholder="Description de la catégorie"
                value={description}
                onChange={(e) => setDescription(e?.target?.value)}
                disabled={isSubmitting}
              />

              {errors?.submit && (
                <p className="text-sm text-error">{errors?.submit}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  loading={isSubmitting}
                  iconName="Plus"
                  iconPosition="left"
                  disabled={!name?.trim() || isSubmitting}
                >
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryQuickAdd;

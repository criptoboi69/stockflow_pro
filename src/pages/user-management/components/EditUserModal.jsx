import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EditUserModal = ({ isOpen, onClose, onUpdateUser, user, currentUserRole }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const fullName = user?.fullName || user?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = user?.firstName || nameParts[0] || '';
      const lastName = user?.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

      setFormData({
        firstName,
        lastName,
        email: user?.email || '',
        role: user?.role || 'employee',
        phone: user?.phone || ''
      });
    }
  }, [user]);

  const roleOptions = [
    {
      value: 'employee',
      label: 'Employé',
      description: 'Accès de base aux fonctionnalités'
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Gestion des équipes et des opérations'
    },
    {
      value: 'admin',
      label: 'Administrateur',
      description: 'Gestion complète de la société'
    },
    ...(currentUserRole === 'super_admin'
      ? [
          {
            value: 'super_admin',
            label: 'Super Admin',
            description: 'Accès complet au système'
          }
        ]
      : [])
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData?.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData?.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData?.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onUpdateUser(user?.id, {
        firstName: formData?.firstName,
        lastName: formData?.lastName,
        phone: formData?.phone,
        role: formData?.role
      });
    } catch (error) {
      setErrors({ submit: 'Erreur lors de la mise à jour' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
      <div className="bg-card rounded-lg w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Modifier l'utilisateur</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              type="text"
              placeholder="Prénom"
              value={formData?.firstName}
              onChange={(e) => handleInputChange('firstName', e?.target?.value)}
              error={errors?.firstName}
              required
            />
            <Input
              label="Nom"
              type="text"
              placeholder="Nom"
              value={formData?.lastName}
              onChange={(e) => handleInputChange('lastName', e?.target?.value)}
              error={errors?.lastName}
              required
            />
          </div>

          <Input
            label="Adresse email"
            type="email"
            placeholder="utilisateur@exemple.com"
            value={formData?.email}
            onChange={(e) => handleInputChange('email', e?.target?.value)}
            error={errors?.email}
            required
          />

          <Select
            label="Rôle"
            options={roleOptions}
            value={formData?.role}
            onChange={(value) => handleInputChange('role', value)}
            error={errors?.role}
            required
          />

          <Input
            label="Téléphone"
            type="tel"
            placeholder="+32 ..."
            value={formData?.phone}
            onChange={(e) => handleInputChange('phone', e?.target?.value)}
            error={errors?.phone}
          />

          {errors?.submit && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{errors?.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" loading={isLoading} iconName="Save" iconPosition="left">
              Sauvegarder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

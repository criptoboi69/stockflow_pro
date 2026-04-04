import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useAuth } from '../../../contexts/AuthContext';

const AddUserModal = ({ isOpen, onClose, onAddUser, currentUserRole, currentCompany }) => {
  // Using props passed from parent instead of useAuth

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'employee',
    sendInvitation: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    ...(currentUserRole === 'super_admin' ? [{
      value: 'super_admin',
      label: 'Super Admin',
      description: 'Accès complet au système'
    }] : [])
  ];



  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData?.role) {
      newErrors.role = 'Le rôle est requis';
    }

    if (!formData?.company) {
      newErrors.company = 'La société est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const newUser = {
        firstName: formData?.firstName,
        lastName: formData?.lastName,
        email: formData?.email,
        role: formData?.role,
        sendInvitation: formData?.sendInvitation
      };

      onAddUser(newUser);
      handleClose();
    } catch (error) {
      setErrors({ submit: 'Erreur lors de l\'ajout de l\'utilisateur' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'employee',
      sendInvitation: true
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-200 p-4">
      <div className="bg-card rounded-lg w-full max-w-md modal-shadow">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Ajouter un utilisateur</h2>
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
            description="Un lien d'invitation sera envoyé à cette adresse"
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



          <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
            <input
              type="checkbox"
              id="sendInvitation"
              checked={formData?.sendInvitation}
              onChange={(e) => handleInputChange('sendInvitation', e?.target?.checked)}
              className="rounded border-border"
            />
            <div>
              <label htmlFor="sendInvitation" className="text-sm font-medium text-text-primary cursor-pointer">
                Envoyer une invitation par email
              </label>
              <p className="text-xs text-text-muted">
                L'utilisateur recevra un lien magique pour configurer son compte
              </p>
            </div>
          </div>

          {errors?.submit && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{errors?.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              iconName="UserPlus"
              iconPosition="left"
            >
              Ajouter l'utilisateur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
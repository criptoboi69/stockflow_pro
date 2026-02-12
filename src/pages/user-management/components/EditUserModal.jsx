import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const EditUserModal = ({ isOpen, onClose, onUpdateUser, user, currentUserRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    company: '',
    status: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name,
        email: user?.email,
        role: user?.role,
        company: user?.company,
        status: user?.status
      });
    }
  }, [user]);

  const roleOptions = [
    { 
      value: 'MEMBRE', 
      label: 'Membre',
      description: 'Accès de base aux fonctionnalités'
    },
    ...(currentUserRole !== 'MEMBRE' ? [{
      value: 'ADMIN_SOCIETE',
      label: 'Admin Société',
      description: 'Gestion complète de la société'
    }] : []),
    ...(currentUserRole === 'SUPER_ADMIN' ? [{
      value: 'SUPER_ADMIN',
      label: 'Super Admin',
      description: 'Accès complet au système'
    }] : [])
  ];

  const statusOptions = [
    { value: 'active', label: 'Actif', description: 'Utilisateur peut se connecter' },
    { value: 'inactive', label: 'Inactif', description: 'Accès suspendu' },
    { value: 'pending', label: 'En attente', description: 'Invitation non acceptée' }
  ];

  const companyOptions = [
    { value: 'TechCorp Solutions', label: 'TechCorp Solutions' },
    { value: 'InnovateLab', label: 'InnovateLab' },
    { value: 'DataFlow Systems', label: 'DataFlow Systems' },
    { value: 'CloudTech Enterprises', label: 'CloudTech Enterprises' }
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

    if (!formData?.status) {
      newErrors.status = 'Le statut est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      
      const updatedUser = {
        ...user,
        ...formData,
        updatedAt: new Date()?.toISOString()
      };

      onUpdateUser(updatedUser);
      handleClose();
    } catch (error) {
      setErrors({ submit: 'Erreur lors de la mise à jour de l\'utilisateur' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleResendInvitation = async () => {
    setIsLoading(true);
    try {
      // Show success message
    } catch (error) {
      setErrors({ submit: 'Erreur lors de l\'envoi de l\'invitation' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const canEditRole = currentUserRole === 'SUPER_ADMIN' || 
    (currentUserRole === 'ADMIN_SOCIETE' && user?.role !== 'SUPER_ADMIN');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-200 p-4">
      <div className="bg-card rounded-lg w-full max-w-md modal-shadow">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Modifier l'utilisateur</h2>
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
          <Input
            label="Nom complet"
            type="text"
            placeholder="Entrez le nom complet"
            value={formData?.name}
            onChange={(e) => handleInputChange('name', e?.target?.value)}
            error={errors?.name}
            required
          />

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
            disabled={!canEditRole}
            required
          />

          {currentUserRole === 'SUPER_ADMIN' && (
            <Select
              label="Société"
              options={companyOptions}
              value={formData?.company}
              onChange={(value) => handleInputChange('company', value)}
              error={errors?.company}
              required
            />
          )}

          <Select
            label="Statut"
            options={statusOptions}
            value={formData?.status}
            onChange={(value) => handleInputChange('status', value)}
            error={errors?.status}
            required
          />

          {user?.status === 'pending' && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warning">Invitation en attente</p>
                  <p className="text-xs text-text-muted">L'utilisateur n'a pas encore accepté l'invitation</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendInvitation}
                  disabled={isLoading}
                >
                  Renvoyer
                </Button>
              </div>
            </div>
          )}

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
              iconName="Save"
              iconPosition="left"
            >
              Sauvegarder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
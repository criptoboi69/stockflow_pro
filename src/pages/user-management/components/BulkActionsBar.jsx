import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const BulkActionsBar = ({ 
  selectedCount, 
  onBulkAction, 
  onClearSelection,
  currentUserRole 
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bulkActions = [
    { 
      value: 'activate', 
      label: 'Activer les utilisateurs',
      icon: 'UserCheck',
      color: 'success'
    },
    { 
      value: 'deactivate', 
      label: 'Désactiver les utilisateurs',
      icon: 'UserX',
      color: 'error'
    },
    ...(currentUserRole !== 'MEMBRE' ? [{
      value: 'change_role',
      label: 'Modifier le rôle',
      icon: 'Users',
      color: 'primary'
    }] : []),
    { 
      value: 'resend_invitation', 
      label: 'Renvoyer les invitations',
      icon: 'Mail',
      color: 'accent'
    },
    ...(currentUserRole === 'SUPER_ADMIN' ? [{
      value: 'delete',
      label: 'Supprimer les utilisateurs',
      icon: 'Trash2',
      color: 'error'
    }] : [])
  ];

  const handleExecuteAction = async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    try {
      await onBulkAction(selectedAction);
      setSelectedAction('');
    } catch (error) {
      logger.error('Bulk action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="Users" size={20} className="text-primary" />
            <span className="font-medium text-text-primary">
              {selectedCount} utilisateur{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Select
              placeholder="Choisir une action"
              options={bulkActions}
              value={selectedAction}
              onChange={setSelectedAction}
              className="w-64"
            />

            <Button
              variant="default"
              size="sm"
              onClick={handleExecuteAction}
              disabled={!selectedAction || isLoading}
              loading={isLoading}
              iconName="Play"
              iconPosition="left"
            >
              Exécuter
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-text-secondary hover:text-text-primary"
        >
          <Icon name="X" size={16} className="mr-2" />
          Annuler la sélection
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
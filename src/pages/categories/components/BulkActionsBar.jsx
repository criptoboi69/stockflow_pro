import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onDelete, onClear }) => {
  return (
    <div className="bg-primary/5 border-b border-primary/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="CheckSquare" size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {selectedCount} catégorie{selectedCount !== 1 ? 's' : ''} sélectionnée{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-text-muted">
              Choisissez une action à appliquer aux éléments sélectionnés
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            iconName="Trash2"
            iconPosition="left"
          >
            Supprimer
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            iconName="X"
            iconPosition="left"
          >
            Désélectionner
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
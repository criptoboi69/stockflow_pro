import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount, onDelete, onClear }) => {
  return (
    <div className="bg-primary/5 border-b border-primary/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center shrink-0">
            <Icon name="CheckSquare" size={14} className="text-primary" />
          </div>
          <p className="font-medium text-text-primary text-sm truncate">
            {selectedCount} catégorie{selectedCount !== 1 ? 's' : ''} sélectionnée{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="text-xs"
          >
            <Icon name="Trash2" size={14} className="mr-1" />
            Supprimer
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-xs hidden sm:inline-flex"
          >
            <Icon name="X" size={14} className="mr-1" />
            Désélectionner
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onClear}
            className="sm:hidden w-8 h-8"
            title="Désélectionner"
          >
            <Icon name="X" size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
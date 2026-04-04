import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategoryItem = ({ 
  category, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}) => {
  const navigate = useNavigate();

  const handleProductsClick = () => {
    navigate(`/products?category=${encodeURIComponent(category?.name || '')}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProductCountColor = (count) => {
    if (count === 0) return 'text-text-muted';
    if (count < 10) return 'text-warning';
    return 'text-success';
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e?.target?.checked)}
          className="rounded border-border"
        />
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="FolderTree" size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{category?.name}</p>
            {category?.parentCategory && (
              <p className="text-xs text-text-muted">
                Sous-catégorie de {category?.parentCategory}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <p className="text-sm text-text-secondary max-w-xs truncate">
          {category?.description || 'Aucune description'}
        </p>
      </td>
      <td className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleProductsClick}
          className={`font-medium ${getProductCountColor(category?.productCount)} hover:bg-primary/10`}
        >
          {category?.productCount} produit{category?.productCount !== 1 ? 's' : ''}
        </Button>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <p className="text-sm text-text-muted">
          {formatDate(category?.createdAt)}
        </p>
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-text-secondary hover:text-primary hover:bg-primary/10"
            title="Modifier la catégorie"
          >
            <Icon name="Edit2" size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-text-secondary hover:text-error hover:bg-error/10"
            title="Supprimer la catégorie"
            disabled={category?.productCount > 0}
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryItem;
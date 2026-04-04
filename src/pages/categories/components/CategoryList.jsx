import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import CategoryItem from './CategoryItem';
import CategoryEditModal from './CategoryEditModal';
import CategoryDeleteModal from './CategoryDeleteModal';
import BulkActionsBar from './BulkActionsBar';
import useResponsive from '../../../hooks/useResponsive';

const CategoryList = ({ 
  categories, 
  onEdit, 
  onDelete, 
  onBulkDelete,
  isLoading = false 
}) => {
  const { isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Filter and sort categories
  const filteredCategories = categories?.filter(category => 
      category?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      (category?.description && category?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
    )?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCategories(filteredCategories?.map(cat => cat?.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectCategory = (categoryId, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(selectedCategories?.filter(id => id !== categoryId));
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  const handleDelete = (category) => {
    setDeletingCategory(category);
  };

  const handleEditSubmit = (updatedCategory) => {
    onEdit(updatedCategory);
    setEditingCategory(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      onDelete(deletingCategory?.id);
      setDeletingCategory(null);
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedCategories);
    setSelectedCategories([]);
    setShowBulkDelete(false);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'ArrowUpDown';
    return sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Catégories</h2>
            <p className="text-sm text-text-muted mt-1">
              {filteredCategories?.length} catégorie{filteredCategories?.length !== 1 ? 's' : ''} trouvée{filteredCategories?.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Icon 
                name="Search" 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" 
              />
              <Input
                type="search"
                placeholder="Rechercher des catégories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Bulk Actions */}
      {selectedCategories?.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedCategories?.length}
          onDelete={() => setShowBulkDelete(true)}
          onClear={() => setSelectedCategories([])}
        />
      )}
      {/* Mobile Card View */}
      {isMobile ? (
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-text-muted">Chargement...</span>
              </div>
            </div>
          ) : filteredCategories?.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Icon name="FolderTree" size={24} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-text-primary font-medium">Aucune catégorie trouvée</p>
                  <p className="text-sm text-text-muted">{searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par créer votre première catégorie'}</p>
                </div>
              </div>
            </div>
          ) : (
            filteredCategories?.map((category) => (
              <div key={category?.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories?.includes(category?.id)}
                        onChange={(e) => handleSelectCategory(category?.id, e?.target?.checked)}
                        className="rounded border-border w-4 h-4"
                      />
                      <h3 className="font-semibold text-text-primary truncate">{category?.name}</h3>
                    </div>
                    {category?.description && (
                      <p className="text-sm text-text-muted mb-2 line-clamp-2">{category?.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-text-muted">
                      <span className="flex items-center space-x-1">
                        <Icon name="Package" size={12} />
                        <span>{category?.productCount || 0} produits</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Icon name="Calendar" size={12} />
                        <span>{new Date(category?.createdAt)?.toLocaleDateString('fr-FR')}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(category)}
                      className="text-text-muted hover:text-text-primary w-8 h-8"
                    >
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(category)}
                      className="text-text-muted hover:text-error w-8 h-8"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      /* Desktop Table View */
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedCategories?.length === filteredCategories?.length && filteredCategories?.length > 0}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="rounded border-border"
                />
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="font-medium text-text-secondary hover:text-text-primary"
                >
                  Nom
                  <Icon name={getSortIcon('name')} size={14} className="ml-1" />
                </Button>
              </th>
              <th className="text-left p-4 hidden lg:table-cell">
                <span className="font-medium text-text-secondary">Description</span>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('productCount')}
                  className="font-medium text-text-secondary hover:text-text-primary"
                >
                  Produits
                  <Icon name={getSortIcon('productCount')} size={14} className="ml-1" />
                </Button>
              </th>
              <th className="text-left p-4 hidden lg:table-cell">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('createdAt')}
                  className="font-medium text-text-secondary hover:text-text-primary"
                >
                  Créé le
                  <Icon name={getSortIcon('createdAt')} size={14} className="ml-1" />
                </Button>
              </th>
              <th className="w-24 p-4">
                <span className="font-medium text-text-secondary">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-text-muted">Chargement des catégories...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCategories?.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Icon name="FolderTree" size={24} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">Aucune catégorie trouvée</p>
                      <p className="text-sm text-text-muted">
                        {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par créer votre première catégorie'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCategories?.map((category) => (
                <CategoryItem
                  key={category?.id}
                  category={category}
                  isSelected={selectedCategories?.includes(category?.id)}
                  onSelect={(checked) => handleSelectCategory(category?.id, checked)}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => handleDelete(category)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
      {/* Modals */}
      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onSave={handleEditSubmit}
          onClose={() => setEditingCategory(null)}
        />
      )}
      {deletingCategory && (
        <CategoryDeleteModal
          category={deletingCategory}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingCategory(null)}
        />
      )}
      {showBulkDelete && (
        <CategoryDeleteModal
          categories={selectedCategories?.map(id => 
            categories?.find(cat => cat?.id === id)
          )}
          onConfirm={handleBulkDelete}
          onClose={() => setShowBulkDelete(false)}
          isBulk={true}
        />
      )}
    </div>
  );
};

export default CategoryList;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import CategoryQuickAdd from './components/CategoryQuickAdd';
import CategoryList from './components/CategoryList';
import { useAuth } from '../../contexts/AuthContext';
import categoryService from '../../services/categoryService';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { currentRole, currentCompany } = useAuth();

  useEffect(() => {
    if (currentCompany?.id) {
      loadCategories();
    } else {
      setCategories([]);
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  const loadCategories = async () => {
    if (!currentCompany?.id) return;
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories(currentCompany.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (categoryData) => {
    try {
      await categoryService.createCategory(categoryData, currentCompany?.id);
      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const handleEditCategory = async (updatedCategory) => {
    try {
      const previous = categories?.find(cat => cat?.id === updatedCategory?.id);
      await categoryService.updateCategory(updatedCategory.id, updatedCategory);
      if (previous?.name && previous.name !== updatedCategory?.name) {
        await categoryService.renameCategoryProducts(currentCompany?.id, previous.name, updatedCategory.name);
      }
      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await categoryService.deleteCategory(categoryId);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const handleBulkDelete = async (categoryIds) => {
    try {
      await Promise.all(categoryIds.map((id) => categoryService.deleteCategory(id)));
      await loadCategories();
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      throw error;
    }
  };

  return (
    <>
      <Helmet>
        <title>Catégories - StockFlow Pro</title>
        <meta name="description" content="Gérez vos catégories de produits avec StockFlow Pro. Organisez votre inventaire efficacement." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <SidebarNavigation
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userRole={currentRole || 'user'}
          currentTenant={currentCompany || { name: 'StockFlow Pro' }}
        />

        <main className={`
          transition-all duration-200 ease-out pt-16 lg:pt-0
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
        `}>
          <PageHeader
              title="Catégories"
              subtitle="Organisez vos produits en catégories pour une gestion optimale de votre inventaire"
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/qr-scanner')}
                    iconName="QrCode"
                    iconPosition="left"
                    className="text-xs lg:text-sm"
                  >
                    Scanner QR
                  </Button>
                  <CategoryQuickAdd onAdd={handleAddCategory} isLoading={isLoading} inlineButton />
                </>
              }
          />

          <div className="max-w-7xl mx-auto p-4 lg:p-6">
              {/* Categories List */}
              <CategoryList
                categories={categories}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onBulkDelete={handleBulkDelete}
                isLoading={isLoading}
              />
            </div>
        </main>

        {/* Quick Action Bar */}
        <QuickActionBar
          variant="floating"
          userRole={currentRole}
        />
      </div>
    </>
  );
};

export default CategoriesPage;
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import CategoryQuickAdd from './components/CategoryQuickAdd';
import CategoryList from './components/CategoryList';
import CategoryStats from './components/CategoryStats';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/productService';

const CategoriesPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRole, currentCompany } = useAuth();

  const canManageCategories = ['super_admin', 'administrator', 'manager'].includes(currentRole);

  const buildCategoriesFromProducts = (productList) => {
    const grouped = new Map();

    productList.forEach((product) => {
      const categoryName = (product?.category || 'Non classé').trim();
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, {
          id: categoryName,
          name: categoryName,
          description: null,
          productCount: 0,
          createdAt: product?.createdAt || new Date().toISOString(),
          updatedAt: product?.updatedAt || new Date().toISOString(),
          parentCategory: null
        });
      }

      const current = grouped.get(categoryName);
      current.productCount += 1;
      current.updatedAt = product?.updatedAt || current.updatedAt;
    });

    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const loadCategories = async () => {
    if (!currentCompany?.id) {
      setCategories([]);
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const productList = await productService.getProducts(currentCompany.id);
      setProducts(productList);
      setCategories(buildCategoriesFromProducts(productList));
    } catch (error) {
      console.error('Error loading categories from products:', error);
      setCategories([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [currentCompany?.id]);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const handleAddCategory = async (categoryData) => {
    const categoryName = categoryData?.name?.trim();
    if (!categoryName || categoryNames.includes(categoryName)) {
      return;
    }

    setCategories((prev) => [
      {
        id: categoryName,
        name: categoryName,
        description: categoryData?.description || null,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parentCategory: null
      },
      ...prev
    ]);
  };

  const handleEditCategory = async (updatedCategory) => {
    const previous = categories.find((cat) => cat.id === updatedCategory?.id);
    if (!previous || previous.name === updatedCategory?.name) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === updatedCategory?.id ? { ...cat, ...updatedCategory } : cat))
      );
      return;
    }

    const impactedProducts = products.filter((p) => (p?.category || 'Non classé') === previous.name);

    try {
      await Promise.all(
        impactedProducts.map((product) =>
          productService.updateProduct(product.id, {
            category: updatedCategory?.name
          })
        )
      );
      await loadCategories();
    } catch (error) {
      console.error('Error renaming category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId);
    if (!categoryToDelete) return;

    const impactedProducts = products.filter((p) => (p?.category || 'Non classé') === categoryToDelete.name);

    try {
      await Promise.all(
        impactedProducts.map((product) =>
          productService.updateProduct(product.id, {
            category: 'Non classé'
          })
        )
      );
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleBulkDelete = async (categoryIds) => {
    const categoriesToDelete = categories.filter((cat) => categoryIds.includes(cat.id));
    const namesToDelete = new Set(categoriesToDelete.map((cat) => cat.name));
    const impactedProducts = products.filter((p) => namesToDelete.has(p?.category || 'Non classé'));

    try {
      await Promise.all(
        impactedProducts.map((product) =>
          productService.updateProduct(product.id, {
            category: 'Non classé'
          })
        )
      );
      await loadCategories();
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
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

        <main className={`transition-all duration-200 ease-out pt-16 lg:pt-0 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Gestion des catégories</h1>
              <p className="text-text-muted">
                Les catégories sont maintenant calculées depuis vos produits réels dans la base.
              </p>
            </div>

            <CategoryStats categories={categories} />

            {canManageCategories && <CategoryQuickAdd onAdd={handleAddCategory} isLoading={isLoading} />}

            <CategoryList
              categories={categories}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onBulkDelete={handleBulkDelete}
              isLoading={isLoading}
            />
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={currentRole} />
      </div>
    </>
  );
};

export default CategoriesPage;

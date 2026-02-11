import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import CategoryQuickAdd from './components/CategoryQuickAdd';
import CategoryList from './components/CategoryList';
import CategoryStats from './components/CategoryStats';
import { useAuth } from '../../contexts/AuthContext';

const CategoriesPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { currentRole, currentCompany } = useAuth();

  // Mock data for categories
  const mockCategories = [
    {
      id: 1,
      name: "Électronique",
      description: "Appareils électroniques et accessoires technologiques",
      productCount: 45,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-10-20T14:22:00Z",
      parentCategory: null
    },
    {
      id: 2,
      name: "Smartphones",
      description: "Téléphones intelligents et accessoires mobiles",
      productCount: 23,
      createdAt: "2024-01-20T09:15:00Z",
      updatedAt: "2024-10-18T11:45:00Z",
      parentCategory: "Électronique"
    },
    {
      id: 3,
      name: "Vêtements",
      description: "Articles vestimentaires pour hommes, femmes et enfants",
      productCount: 78,
      createdAt: "2024-02-01T16:20:00Z",
      updatedAt: "2024-10-22T09:30:00Z",
      parentCategory: null
    },
    {
      id: 4,
      name: "Chaussures",
      description: "Chaussures de sport, ville et accessoires",
      productCount: 34,
      createdAt: "2024-02-10T11:45:00Z",
      updatedAt: "2024-10-19T15:10:00Z",
      parentCategory: "Vêtements"
    },
    {
      id: 5,
      name: "Maison & Jardin",
      description: "Articles pour la maison, décoration et jardinage",
      productCount: 56,
      createdAt: "2024-02-15T14:30:00Z",
      updatedAt: "2024-10-21T12:15:00Z",
      parentCategory: null
    },
    {
      id: 6,
      name: "Mobilier",
      description: "Meubles et accessoires d\'ameublement",
      productCount: 12,
      createdAt: "2024-03-01T08:00:00Z",
      updatedAt: "2024-10-23T16:45:00Z",
      parentCategory: "Maison & Jardin"
    },
    {
      id: 7,
      name: "Livres",
      description: "Livres, magazines et publications",
      productCount: 0,
      createdAt: "2024-03-10T13:20:00Z",
      updatedAt: "2024-03-10T13:20:00Z",
      parentCategory: null
    },
    {
      id: 8,
      name: "Sports & Loisirs",
      description: "Équipements sportifs et articles de loisirs",
      productCount: 29,
      createdAt: "2024-03-15T10:10:00Z",
      updatedAt: "2024-10-20T08:30:00Z",
      parentCategory: null
    },
    {
      id: 9,
      name: "Beauté & Santé",
      description: "Produits cosmétiques et de soins personnels",
      productCount: 41,
      createdAt: "2024-04-01T12:00:00Z",
      updatedAt: "2024-10-24T14:20:00Z",
      parentCategory: null
    },
    {
      id: 10,
      name: "Alimentation",
      description: "Produits alimentaires et boissons",
      productCount: 0,
      createdAt: "2024-04-15T15:30:00Z",
      updatedAt: "2024-04-15T15:30:00Z",
      parentCategory: null
    }
  ];

  useEffect(() => {
    // Simulate API call
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCategories(mockCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleAddCategory = async (categoryData) => {
    try {
      const newCategory = {
        id: Math.max(...categories?.map(c => c?.id)) + 1,
        ...categoryData,
        productCount: 0,
        createdAt: new Date()?.toISOString(),
        updatedAt: new Date()?.toISOString(),
        parentCategory: null
      };

      setCategories(prev => [newCategory, ...prev]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEditCategory = async (updatedCategory) => {
    try {
      setCategories(prev => 
        prev?.map(cat => 
          cat?.id === updatedCategory?.id ? updatedCategory : cat
        )
      );
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setCategories(prev => prev?.filter(cat => cat?.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleBulkDelete = async (categoryIds) => {
    try {
      setCategories(prev => 
        prev?.filter(cat => !categoryIds?.includes(cat?.id))
      );
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
          currentTenant={currentCompany?.name || 'StockFlow Pro'}
        />

        <main className={`
          transition-all duration-200 ease-out pt-16 lg:pt-0
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
        `}>
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary">Catégories</h1>
                  <p className="text-text-muted mt-2">
                    Organisez vos produits en catégories pour une gestion optimale de votre inventaire
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <CategoryStats categories={categories} />

            {/* Quick Add Form */}
            <CategoryQuickAdd onAdd={handleAddCategory} />

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
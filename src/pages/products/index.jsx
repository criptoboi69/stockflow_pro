import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/productService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import ProductFilters from './components/ProductFilters';
import ProductActions from './components/ProductActions';
import ProductTable from './components/ProductTable';
import ProductCard from './components/ProductCard';
import ProductPagination from './components/ProductPagination';
import ProductModal from './components/ProductModal';
import Icon from '../../components/AppIcon';
import useResponsive from '../../hooks/useResponsive';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useAuth();
  const { currentCompany, currentRole, loading: authLoading } = authContext || {};

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMinBreakpoint } = useResponsive();
  const isMdUp = isMinBreakpoint('md');
  const [viewMode, setViewMode] = useState(isMdUp ? 'list' : 'grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams?.get('status') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || 'all');

  // Selection State
  const [selectedProducts, setSelectedProducts] = useState([]);
  const searchInputRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.get('page')) || 1);
  const [pageSize, setPageSize] = useState(parseInt(searchParams?.get('pageSize')) || 25);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'view', // 'view', 'edit', 'add'
    product: null
  });

  // Products data from Supabase
  const [products, setProducts] = useState([]);

  const effectiveRole = currentRole || 'user';

  // Real-time subscription for products
  useRealtimeSubscription({
    table: 'products',
    filter: currentCompany?.id ? { column: 'company_id', value: currentCompany?.id } : null,
    enabled: !!currentCompany?.id,
    onInsert: (newProduct) => {
      // Convert snake_case to camelCase and add to list
      const camelCaseProduct = productService?.convertToCamelCase(newProduct);
      setProducts(prev => [camelCaseProduct, ...prev]);
    },
    onUpdate: (updatedProduct) => {
      // Convert and update in list
      const camelCaseProduct = productService?.convertToCamelCase(updatedProduct);
      setProducts(prev => prev?.map(p => p?.id === camelCaseProduct?.id ? camelCaseProduct : p));
    },
    onDelete: (deletedProduct) => {
      // Remove from list
      setProducts(prev => prev?.filter(p => p?.id !== deletedProduct?.id));
    }
  });

  // Real-time subscription for stock movements (to update product quantities)
  useRealtimeSubscription({
    table: 'stock_movements',
    filter: currentCompany?.id ? { column: 'company_id', value: currentCompany?.id } : null,
    enabled: !!currentCompany?.id,
    onInsert: (newMovement) => {
      // Reload products to get updated quantities
      loadProducts();
    }
  });

  // Load products from Supabase
  useEffect(() => {
    
    if (authLoading) {
      // Wait for auth to finish loading
      return;
    }
    
    if (currentCompany?.id) {
      loadProducts();
    } else {
      // No company available, stop loading
      setIsLoading(false);
    }
  }, [currentCompany, authLoading]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService?.getProducts(currentCompany?.id);
      setProducts(data);
    } catch (err) {
      console.error('[Products] Error loading products:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = !searchQuery ||
    product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    product?.sku?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
    product?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || product?.status === selectedStatus;

    const matchesCategory = selectedCategory === 'all' || product?.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  })?.sort((a, b) => {
    const aValue = a?.[sortField];
    const bValue = b?.[sortField];

    if (typeof aValue === 'string') {
      return sortDirection === 'asc' ?
      aValue?.localeCompare(bValue) :
      bValue?.localeCompare(aValue);
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Pagination
  const totalProducts = filteredProducts?.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts?.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (isMdUp && viewMode === 'grid') {
      setViewMode('list');
    }
    if (!isMdUp && viewMode === 'list') {
      setViewMode('grid');
    }
  }, [isMdUp]);

  useEffect(() => {
    const focusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    const fromQuickAction = () => focusSearch();
    window.addEventListener('stockflow:quick-search', fromQuickAction);

    if (searchParams?.get('focusSearch') === 'true') {
      focusSearch();
      const params = new URLSearchParams(searchParams);
      params.delete('focusSearch');
      setSearchParams(params, { replace: true });
    }

    return () => window.removeEventListener('stockflow:quick-search', fromQuickAction);
  }, [searchParams, setSearchParams]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params?.set('search', searchQuery);
    if (selectedStatus !== 'all') params?.set('status', selectedStatus);
    if (selectedCategory !== 'all') params?.set('category', selectedCategory);
    if (currentPage > 1) params?.set('page', currentPage?.toString());
    if (pageSize !== 25) params?.set('pageSize', pageSize?.toString());

    setSearchParams(params);
  }, [searchQuery, selectedStatus, selectedCategory, currentPage, pageSize, setSearchParams]);

  // Enhanced responsive view mode handling
  useEffect(() => {
    const handleResize = () => {
      if (!isMdUp && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Event Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const handleSelectProduct = (productId, isSelected) => {
    setSelectedProducts((prev) =>
    isSelected ?
    [...prev, productId] :
    prev?.filter((id) => id !== productId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedProducts(isSelected ? paginatedProducts?.map((p) => p?.id) : []);
  };

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedProducts([]);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedProducts([]);
  };

  const handleBulkAction = (action, productIds) => {
    // Implement bulk actions here
    setSelectedProducts([]);
  };

  const handleAddProduct = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      product: null
    });
  };

  const handleViewProduct = (product) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      product
    });
  };

  const handleEditProduct = (product) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      product
    });
  };

  const handleGenerateQR = (product) => {
    navigate(`/qr-scanner?product=${product?.id}`);
  };

  const handleStockMovement = (product) => {
    navigate(`/stock-movements?product=${product?.id}&action=add`);
  };

  const handleSaveProduct = async (productData) => {
    try {
      setIsLoading(true);
      
      if (modalState?.mode === 'add') {
        await productService?.createProduct(productData, currentCompany?.id, user?.id);
      } else if (modalState?.mode === 'edit') {
        await productService?.updateProduct(modalState?.product?.id, productData);
      }
      
      await loadProducts();
      setModalState({ isOpen: false, mode: 'view', product: null });
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Erreur lors de la sauvegarde du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, imageFilePath) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      setIsLoading(true);
      await productService?.deleteProduct(productId, imageFilePath);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Erreur lors de la suppression du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'view',
      product: null
    });
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-warning mx-auto mb-4" />
          <p className="text-text-muted">
            {authLoading || isLoading ? 'Chargement...' : 'Aucune société associée à votre compte'}
          </p>
          {!authLoading && !isLoading && (
            <p className="text-text-muted text-sm mt-2">
              Veuillez contacter votre administrateur
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={loadProducts}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <SidebarNavigation
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={currentRole || 'user'}
        currentTenant={currentCompany || { name: 'StockFlow Pro' }} />

      {/* Enhanced Main Content with responsive layout */}
      <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        {/* Mobile Header Spacer with responsive height */}
        <div className="h-14 sm:h-16 lg:hidden" />

        {/* Enhanced Page Header with responsive design */}
        <div className="bg-surface border-b border-border">
          <div className="container-responsive py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Gestion des Produits</h1>
                <p className="text-text-muted mt-1 text-sm sm:text-base">
                  Gérez votre catalogue de produits et suivez les niveaux de stock
                </p>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <QuickActionBar
                  variant="header"
                  userRole={effectiveRole} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content with responsive container */}
        <div className="container-responsive py-4 sm:py-6">
          {/* Enhanced Filters with mobile-first design */}
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onClearFilters={handleClearFilters}
            resultCount={totalProducts}
            isLoading={isLoading} />

          {/* Enhanced Actions with responsive layout */}
          <ProductActions
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedProducts={selectedProducts}
            onBulkAction={handleBulkAction}
            onAddProduct={handleAddProduct}
            totalProducts={totalProducts}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange} />

          {/* Enhanced Products Display with responsive grid */}
          {viewMode === 'list' && isMdUp ? (
            <ProductTable
              products={paginatedProducts}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onSelectAll={handleSelectAll}
              onEdit={handleEditProduct}
              onView={handleViewProduct}
              onGenerateQR={handleGenerateQR}
              onStockMovement={handleStockMovement}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts?.map((product) => (
                <ProductCard
                  key={product?.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onView={handleViewProduct}
                  onGenerateQR={handleGenerateQR}
                  onStockMovement={handleStockMovement} />
              ))}
            </div>
          )}

          {/* Enhanced Empty State with responsive design */}
          {paginatedProducts?.length === 0 && !isLoading && (
            <div className="text-center py-8 sm:py-12 px-4">
              <Icon name="Package" size={48} className="sm:size-16 mx-auto text-text-muted mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-text-primary mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-text-muted mb-4 sm:mb-6 text-sm sm:text-base max-w-md mx-auto">
                Essayez de modifier vos critères de recherche ou ajoutez un nouveau produit.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleClearFilters}
                  className="text-primary hover:text-primary/80 font-medium touch-target text-sm sm:text-base">
                  Effacer les filtres
                </button>
                <span className="text-text-muted hidden sm:inline">ou</span>
                <button
                  onClick={handleAddProduct}
                  className="text-primary hover:text-primary/80 font-medium touch-target text-sm sm:text-base">
                  Ajouter un produit
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Pagination with responsive design */}
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalProducts={totalProducts}
            pageSize={pageSize}
            onPageChange={handlePageChange} />
        </div>
      </div>

      {/* Enhanced Quick Action Bar with responsive positioning */}
      <QuickActionBar
        variant="floating"
        userRole={effectiveRole} />

      {/* Product Modal with responsive sizing */}
      <ProductModal
        isOpen={modalState?.isOpen}
        onClose={handleCloseModal}
        product={modalState?.product}
        mode={modalState?.mode}
        onSave={handleSaveProduct} />
    </div>
  );
};

export default Products;
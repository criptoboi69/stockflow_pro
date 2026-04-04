import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import stockMovementService from '../../services/stockMovementService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import useResponsive from '../../hooks/useResponsive';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Button from '../../components/ui/Button';
import QuickActionBar from '../../components/ui/QuickActionBar';
import ProductFilters from './components/ProductFilters';
import ProductActions from './components/ProductActions';
import ProductTable from './components/ProductTable';
import ProductCard from './components/ProductCard';
import ProductPagination from './components/ProductPagination';
import ProductModal from './components/ProductModal';
import QRCodeGenerator from './components/QRCodeGenerator';
import NewMovementModal from '../stock-movements/components/NewMovementModal';
import Icon from '../../components/AppIcon';
import PageHeader from '../../components/ui/PageHeader';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useAuth();
  const { user, currentCompany, currentRole, loading: authLoading } = authContext || {};
  const { isMobile, isDesktop } = useResponsive();

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams?.get('status') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || 'all');

  // Selection State
  const [selectedProducts, setSelectedProducts] = useState([]);

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
  const [openedFromNotification, setOpenedFromNotification] = useState(null); // Track product ID opened from notification

  const [qrModalState, setQrModalState] = useState({
    isOpen: false,
    product: null
  });
  const [movementModalState, setMovementModalState] = useState({
    isOpen: false,
    product: null
  });

  // Products data from Supabase
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([{ value: 'all', label: 'Toutes les catégories' }]);

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

  useEffect(() => {
    const loadCategories = async () => {
      if (!currentCompany?.id) {
        setCategoryOptions([{ value: 'all', label: 'Toutes les catégories' }]);
        return;
      }

      try {
        const categories = await categoryService.getCategories(currentCompany.id);
        setCategoryOptions([
          { value: 'all', label: 'Toutes les catégories' },
          ...(categories || []).map((category) => ({ value: category.name, label: category.name })),
        ]);
      } catch (error) {
        console.error('[Products] Error loading categories:', error);
        setCategoryOptions([{ value: 'all', label: 'Toutes les catégories' }]);
      }
    };

    loadCategories();
  }, [currentCompany]);

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

  // Check if we need to open a product modal after loading
  useEffect(() => {
    if (isLoading || !products?.length) return;
    
    // Check localStorage first (for notifications)
    const storedProductId = localStorage.getItem('openProductModal');
    const urlProductId = searchParams?.get('product') || searchParams?.get('id');
    const productId = storedProductId || urlProductId;
    
    if (!productId) return;
    
    // Already opened
    if (openedFromNotification === productId) return;
    
    const target = products.find((p) => p?.id === productId);
    if (!target) return;
    
    // Open modal after a short delay to ensure UI is ready
    setTimeout(() => {
      setModalState({ isOpen: true, mode: 'view', product: target });
      setOpenedFromNotification(productId);
      // Clear the localStorage flag
      localStorage.removeItem('openProductModal');
    }, 300);
  }, [products, isLoading, searchParams, openedFromNotification]);

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

  useEffect(() => {
    // Support both 'product' and 'id' params (for notifications)
    const productId = searchParams?.get('product') || searchParams?.get('id');
    const modeFromUrl = searchParams?.get('mode');
    
    console.log('[Products] useEffect notification check:', {
      productId,
      modeFromUrl,
      productsLoaded: products?.length || 0,
      openedFromNotification,
      willOpen: productId && products?.length > 0 && openedFromNotification !== productId
    });
    
    // Wait for products to be loaded
    if (!productId || !products || products.length === 0) {
      console.log('[Products] Skipping: no productId or products not loaded');
      return;
    }
    
    // Prevent opening multiple times for same product
    if (openedFromNotification === productId) {
      console.log('[Products] Skipping: already opened this product');
      return;
    }

    const target = products.find((p) => p?.id === productId);
    console.log('[Products] Found target:', target);
    if (!target) {
      console.log('[Products] Skipping: target not found in products list');
      return;
    }

    if (modeFromUrl === 'add-movement') {
      console.log('[Products] Opening movement modal');
      setMovementModalState({ isOpen: true, product: target });
      setOpenedFromNotification(productId);
      return;
    }

    // Open in view mode by default (for notifications)
    const modalMode = modeFromUrl === 'edit' ? 'edit' : 'view';
    console.log('[Products] Opening product modal in', modalMode, 'mode');
    setModalState({ isOpen: true, mode: modalMode, product: target });
    setOpenedFromNotification(productId);
  }, [searchParams, products, openedFromNotification]);

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

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params?.set('search', searchQuery);
    if (selectedStatus !== 'all') params?.set('status', selectedStatus);
    if (selectedCategory !== 'all') params?.set('category', selectedCategory);
    if (currentPage > 1) params?.set('page', currentPage?.toString());
    if (pageSize !== 25) params?.set('pageSize', pageSize?.toString());

    const linkedProduct = searchParams?.get('product');
    const linkedMode = searchParams?.get('mode');
    const linkedQr = searchParams?.get('qr');
    if (linkedProduct) params.set('product', linkedProduct);
    if (linkedMode) params.set('mode', linkedMode);
    if (linkedQr) params.set('qr', linkedQr);

    setSearchParams(params);
  }, [searchQuery, selectedStatus, selectedCategory, currentPage, pageSize, setSearchParams, searchParams]);

  // Keep user-selected view mode on mobile too.

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
    if (action === 'export' && !['super_admin', 'administrator']?.includes(effectiveRole)) {
      setError('Accès refusé: export réservé aux administrateurs');
      return;
    }
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
    setQrModalState({
      isOpen: true,
      product
    });
  };

  const handlePersistQRCode = async (qrData) => {
    try {
      if (!qrModalState?.product?.id) return;
      await productService?.updateProduct(qrModalState.product.id, { qrCode: qrData });
      await loadProducts();
      setQrModalState((prev) => ({ ...prev, product: { ...prev.product, qrCode: qrData } }));
    } catch (err) {
      console.error('Error saving QR code:', err);
      const backendMsg = err?.message || err?.error_description || err?.details;
      setError(backendMsg ? `Erreur lors de l'enregistrement du QR code: ${backendMsg}` : "Erreur lors de l'enregistrement du QR code");
      throw err;
    }
  };

  const handleStockMovement = (product) => {
    setMovementModalState({ isOpen: true, product });
  };

  const handleSaveMovement = async (movementData) => {
    try {
      await stockMovementService?.createStockMovement(movementData, currentCompany?.id, user?.id);
      setMovementModalState({ isOpen: false, product: null });
      await loadProducts();
    } catch (err) {
      console.error('Error creating movement from products page:', err);
      const backendMsg = err?.message || err?.error_description || err?.details;
      setError(backendMsg ? `Erreur lors de la création du mouvement: ${backendMsg}` : 'Erreur lors de la création du mouvement');
      throw err;
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      console.log('[products] handleSaveProduct start', {
        mode: modalState?.mode,
        productId: modalState?.product?.id,
        imageUrls: productData?.imageUrls?.length || 0,
        imageFilePaths: productData?.imageFilePaths?.length || 0
      });
      setIsLoading(true);
      
      if (modalState?.mode === 'add') {
        const isUuid = (value) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');

        const safeUserId = isUuid(user?.id) ? user?.id : null;
        console.log('[products] createProduct start');
        await productService?.createProduct(productData, currentCompany?.id, safeUserId);
        console.log('[products] createProduct done');
      } else if (modalState?.mode === 'edit') {
        console.log('[products] updateProduct start');
        await productService?.updateProduct(modalState?.product?.id, productData);
        console.log('[products] updateProduct done');
      }
      
      console.log('[products] loadProducts start after save');
      await loadProducts();
      console.log('[products] loadProducts done after save');
      handleCloseModal();
    } catch (err) {
      console.error('Error saving product:', err);
      const backendMsg = err?.message || err?.error_description || err?.details;
      setError(backendMsg ? `Erreur lors de la sauvegarde du produit: ${backendMsg}` : 'Erreur lors de la sauvegarde du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, imageFilePath) => {
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
    setOpenedFromNotification(null);

    const params = new URLSearchParams(searchParams);
    params.delete('product');
    params.delete('mode');
    params.delete('qr');
    setSearchParams(params);
  };

  const handleCloseMovementModal = () => {
    setMovementModalState({ isOpen: false, product: null });
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

        <PageHeader
          title="Produits"
          subtitle="Gérez votre catalogue de produits et suivez les niveaux de stock"
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
              <Button
                size="sm"
                onClick={handleAddProduct}
                iconName="Plus"
                iconPosition="left"
                className="text-xs lg:text-sm"
              >
                Ajouter produit
              </Button>
            </>
          }
        />

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
            isLoading={isLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            categoryOptions={categoryOptions} />

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
            onPageSizeChange={handlePageSizeChange}
            userRole={effectiveRole} />

          {/* Enhanced Products Display with responsive grid */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
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
            </div>
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
              <div className="flex items-center justify-center">
                <button
                  onClick={handleClearFilters}
                  className="text-primary hover:text-primary/80 font-medium touch-target text-sm sm:text-base">
                  Effacer les filtres
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
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        canDelete={['super_admin', 'administrator']?.includes(effectiveRole)} />

      {/* QR Modal: show/print product QR code directly from product list */}
      <QRCodeGenerator
        isOpen={qrModalState?.isOpen}
        onClose={() => setQrModalState({ isOpen: false, product: null })}
        product={qrModalState?.product}
        onGenerate={handlePersistQRCode}
      />

      <NewMovementModal
        isOpen={movementModalState?.isOpen}
        onClose={handleCloseMovementModal}
        onSave={handleSaveMovement}
        userRole={effectiveRole}
        initialProduct={movementModalState?.product}
      />
    </div>
  );
};

export default Products;
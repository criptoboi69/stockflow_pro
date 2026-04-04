import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';
import productService from '../services/productService';

/**
 * Hook pour gérer les opérations CRUD sur les produits
 * @param {string} companyId - Company UUID
 * @returns {Object} products, loading, error, loadProducts, deleteProduct, saveProduct
 */
export const useProducts = (companyId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger tous les produits de la company
   */
  const loadProducts = useCallback(async () => {
    if (!companyId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await productService.getProducts(companyId);
      setProducts(data);
    } catch (err) {
      logger.error('[useProducts] Error loading products:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  /**
   * Créer ou mettre à jour un produit
   * @param {Object} productData - Product data
   * @param {string} mode - 'add' | 'edit'
   * @param {string} productId - Product ID (for edit mode)
   */
  const saveProduct = useCallback(async (productData, mode, productId) => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'edit' && productId) {
        await productService.updateProduct(productId, productData);
      } else {
        await productService.createProduct(productData, companyId);
      }
      
      // Reload products to get updated list
      await loadProducts();
      
      return { success: true };
    } catch (err) {
      logger.error('[useProducts] Error saving product:', err);
      setError(err?.message || 'Échec de l\'enregistrement du produit');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [companyId, loadProducts]);

  /**
   * Supprimer un produit
   * @param {string} productId - Product UUID
   * @param {string} imageFilePath - Optional image file path to delete
   */
  const deleteProduct = useCallback(async (productId, imageFilePath = null) => {
    setLoading(true);
    setError(null);

    try {
      await productService.deleteProduct(productId, imageFilePath);
      
      // Remove from local state (no need to reload)
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      return { success: true };
    } catch (err) {
      logger.error('[useProducts] Error deleting product:', err);
      setError(err?.message || 'Échec de la suppression du produit');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Trouver un produit par son ID
   * @param {string} productId - Product UUID
   * @returns {Object|null} Product or null
   */
  const findProduct = useCallback((productId) => {
    return products.find(p => p.id === productId) || null;
  }, [products]);

  /**
   * Filtrer les produits
   * @param {Object} filters - { search, status, category }
   * @returns {Array} Filtered products
   */
  const filterProducts = useCallback((filters = {}) => {
    let filtered = [...products];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    return filtered;
  }, [products]);

  /**
   * Trier les produits
   * @param {Array} productsToSort - Products array
   * @param {string} field - Field to sort by
   * @param {string} direction - 'asc' | 'desc'
   * @returns {Array} Sorted products
   */
  const sortProducts = useCallback((productsToSort, field, direction = 'asc') => {
    return [...productsToSort].sort((a, b) => {
      const aValue = a[field] ?? '';
      const bValue = b[field] ?? '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const cmp = aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' });
        return direction === 'asc' ? cmp : -cmp;
      }

      const cmp = Number(aValue) - Number(bValue);
      return direction === 'asc' ? cmp : -cmp;
    });
  }, []);

  /**
   * Obtenir les statistiques produits
   * @returns {Object} { total, inStock, lowStock, outOfStock, totalValue }
   */
  const getStats = useCallback(() => {
    const total = products.length;
    const inStock = products.filter(p => p.status === 'in_stock').length;
    const lowStock = products.filter(p => p.status === 'low_stock').length;
    const outOfStock = products.filter(p => p.status === 'out_of_stock').length;
    const totalValue = products.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.price || 0)), 0);

    return { total, inStock, lowStock, outOfStock, totalValue };
  }, [products]);

  // Reset state when companyId changes
  const reset = useCallback(() => {
    setProducts([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    // State
    products,
    loading,
    error,

    // Actions
    loadProducts,
    saveProduct,
    deleteProduct,
    findProduct,
    filterProducts,
    sortProducts,
    getStats,
    reset,

    // Derived state
    stats: getStats(),
    isEmpty: products.length === 0,
    hasError: error !== null
  };
};

export default useProducts;

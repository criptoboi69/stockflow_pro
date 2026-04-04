import { supabase } from '../lib/supabase';
import storageService from './storageService';

class ProductService {
  /**
   * Get all products for the current company
   * @param {string} companyId - Company UUID
   * @returns {Promise<Array>} List of products
   */
  async getProducts(companyId) {
    try {
      const { data, error } = await supabase?.from('products')?.select('*')?.eq('company_id', companyId)?.order('created_at', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(product => this.convertToCamelCase(product)) || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   * @param {string} productId - Product UUID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(productId) {
    try {
      const { data, error } = await supabase?.from('products')?.select('*')?.eq('id', productId)?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data in camelCase
   * @param {string} companyId - Company UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData, companyId, userId) {
    try {
      const snakeCaseData = this.convertToSnakeCase(productData);
      
      const payload = {
        ...snakeCaseData,
        company_id: companyId
      };

      // IMPORTANT: created_by removed for compatibility with demo/auth-mixed sessions
      // (some sessions expose non-UUID IDs like "demo-user").

      const { data, error } = await supabase?.from('products')?.insert(payload)?.select()?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   * @param {string} productId - Product UUID
   * @param {Object} productData - Updated product data in camelCase
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    try {
      const snakeCaseData = this.convertToSnakeCase(productData);
      console.log('[productService] updateProduct payload', {
        productId,
        keys: Object.keys(snakeCaseData || {}),
        image_urls: snakeCaseData?.image_urls?.length || 0,
        image_file_paths: snakeCaseData?.image_file_paths?.length || 0
      });
      
      const { data, error } = await supabase?.from('products')?.update(snakeCaseData)?.eq('id', productId)?.select()?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   * @param {string} productId - Product UUID
   * @param {string} imageFilePath - Optional image file path to delete
   * @returns {Promise<void>}
   */
  async deleteProduct(productId, imageFilePath = null) {
    try {
      // Delete image from storage if exists
      if (imageFilePath) {
        await storageService?.deleteProductImage(imageFilePath);
      }

      const { error } = await supabase?.from('products')?.delete()?.eq('id', productId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Search products by query
   * @param {string} companyId - Company UUID
   * @param {string} searchQuery - Search term
   * @returns {Promise<Array>} Filtered products
   */
  async searchProducts(companyId, searchQuery) {
    try {
      const { data, error } = await supabase?.from('products')?.select('*')?.eq('company_id', companyId)?.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => this.convertToCamelCase(product)) || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Filter products by category and status
   * @param {string} companyId - Company UUID
   * @param {string} category - Category filter
   * @param {string} status - Status filter
   * @returns {Promise<Array>} Filtered products
   */
  async filterProducts(companyId, category = null, status = null) {
    try {
      let query = supabase?.from('products')?.select('*')?.eq('company_id', companyId);

      if (category && category !== 'all') {
        query = query?.eq('category', category);
      }

      if (status && status !== 'all') {
        query = query?.eq('status', status);
      }

      const { data, error } = await query?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(product => this.convertToCamelCase(product)) || [];
    } catch (error) {
      console.error('Error filtering products:', error);
      throw error;
    }
  }

  /**
   * Get product stats for dashboard
   * @param {string} companyId - Company UUID
   * @returns {Promise<{totalProducts:number,totalQuantity:number,lowStockCount:number}>}
   */
  async getProductStats(companyId) {
    try {
      const { data, error } = await supabase
        ?.from('products')
        ?.select('quantity,min_stock')
        ?.eq('company_id', companyId);

      if (error) throw error;

      const rows = data || [];
      const totalProducts = rows.length;
      const totalQuantity = rows.reduce((sum, p) => sum + Number(p?.quantity || 0), 0);
      const lowStockCount = rows.filter((p) => Number(p?.quantity || 0) <= Number(p?.min_stock || 0)).length;

      return { totalProducts, totalQuantity, lowStockCount };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  }

  /**
   * Convert database snake_case to React camelCase
   */
  convertToCamelCase(product) {
    if (!product) return null;
    
    return {
      id: product?.id,
      companyId: product?.company_id,
      name: product?.name,
      sku: product?.sku,
      description: product?.description,
      category: product?.category,
      location: product?.product_location,
      quantity: product?.quantity,
      price: product?.price,
      minStock: product?.min_stock,
      imageUrl: product?.image_url,
      imageFilePath: product?.image_file_path,
      imageUrls: Array.isArray(product?.image_urls) ? product?.image_urls : (product?.image_url ? [product?.image_url] : []),
      imageFilePaths: Array.isArray(product?.image_file_paths) ? product?.image_file_paths : (product?.image_file_path ? [product?.image_file_path] : []),
      status: product?.status,
      qrCode: product?.qr_code,
      createdBy: product?.created_by,
      createdAt: product?.created_at,
      updatedAt: product?.updated_at
    };
  }

  /**
   * Convert React camelCase to database snake_case
   */
  convertToSnakeCase(product) {
    const snakeCase = {};
    
    if (product?.name !== undefined) snakeCase.name = product?.name;
    if (product?.sku !== undefined) snakeCase.sku = product?.sku;
    if (product?.description !== undefined) snakeCase.description = product?.description;
    if (product?.category !== undefined) snakeCase.category = product?.category;
    if (product?.location !== undefined) snakeCase.product_location = product?.location;
    if (product?.quantity !== undefined) {
      const q = Number(product?.quantity);
      snakeCase.quantity = Number.isFinite(q) ? q : 0;
    }

    if (product?.price !== undefined) {
      if (product?.price === '' || product?.price === null) {
        snakeCase.price = null;
      } else {
        const p = Number(product?.price);
        snakeCase.price = Number.isFinite(p) ? p : null;
      }
    }

    if (product?.minStock !== undefined) {
      const ms = Number(product?.minStock);
      snakeCase.min_stock = Number.isFinite(ms) ? ms : 0;
    }
    if (product?.imageUrl !== undefined) snakeCase.image_url = product?.imageUrl;
    if (product?.imageFilePath !== undefined) snakeCase.image_file_path = product?.imageFilePath;
    if (product?.imageUrls !== undefined) snakeCase.image_urls = product?.imageUrls;
    if (product?.imageFilePaths !== undefined) snakeCase.image_file_paths = product?.imageFilePaths;
    if (product?.qrCode !== undefined) snakeCase.qr_code = product?.qrCode;
    
    return snakeCase;
  }
}

export default new ProductService();
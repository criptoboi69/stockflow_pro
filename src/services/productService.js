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
      
      const { data, error } = await supabase?.from('products')?.insert({
          ...snakeCaseData,
          company_id: companyId,
          created_by: userId
        })?.select()?.single();

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
      location: product?.location,
      quantity: product?.quantity,
      price: product?.price,
      minStock: product?.min_stock,
      imageUrl: product?.image_url,
      imageFilePath: product?.image_file_path,
      status: product?.status,
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
    if (product?.location !== undefined) snakeCase.location = product?.location;
    if (product?.quantity !== undefined) snakeCase.quantity = product?.quantity;
    if (product?.price !== undefined) snakeCase.price = product?.price;
    if (product?.minStock !== undefined) snakeCase.min_stock = product?.minStock;
    if (product?.imageUrl !== undefined) snakeCase.image_url = product?.imageUrl;
    if (product?.imageFilePath !== undefined) snakeCase.image_file_path = product?.imageFilePath;
    
    return snakeCase;
  }
}

export default new ProductService();
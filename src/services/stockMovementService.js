import { supabase } from '../lib/supabase';

class StockMovementService {
  /**
   * Get all stock movements for the current company
   * @param {string} companyId - Company UUID
   * @returns {Promise<Array>} List of stock movements with product details
   */
  async getStockMovements(companyId) {
    try {
      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.select(`
          *,
          product:products(
            id,
            name,
            sku,
            image_url,
            category
          ),
          user:user_profiles(
            id,
            full_name
          )
        `)
        ?.eq('company_id', companyId)
        ?.order('created_at', { ascending: false });

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(movement => this.convertToCamelCase(movement)) || [];
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      throw error;
    }
  }

  /**
   * Get a single stock movement by ID
   * @param {string} movementId - Movement UUID
   * @returns {Promise<Object>} Movement data
   */
  async getStockMovement(movementId) {
    try {
      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.select(`
          *,
          product:products(
            id,
            name,
            sku,
            image_url,
            category
          ),
          user:user_profiles(
            id,
            full_name
          )
        `)
        ?.eq('id', movementId)
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error fetching stock movement:', error);
      throw error;
    }
  }

  /**
   * Create a new stock movement
   * @param {Object} movementData - Movement data in camelCase
   * @param {string} companyId - Company UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Created movement
   */
  async createStockMovement(movementData, companyId, userId) {
    try {
      const snakeCaseData = this.convertToSnakeCase(movementData);
      
      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.insert({
          ...snakeCaseData,
          company_id: companyId,
          created_by: userId
        })
        ?.select(`
          *,
          product:products(
            id,
            name,
            sku,
            image_url,
            category
          ),
          user:user_profiles(
            id,
            full_name
          )
        `)
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error creating stock movement:', error);
      throw error;
    }
  }

  /**
   * Update an existing stock movement
   * @param {string} movementId - Movement UUID
   * @param {Object} movementData - Updated movement data in camelCase
   * @returns {Promise<Object>} Updated movement
   */
  async updateStockMovement(movementId, movementData) {
    try {
      const snakeCaseData = this.convertToSnakeCase(movementData);
      
      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.update(snakeCaseData)
        ?.eq('id', movementId)
        ?.select(`
          *,
          product:products(
            id,
            name,
            sku,
            image_url,
            category
          ),
          user:user_profiles(
            id,
            full_name
          )
        `)
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error updating stock movement:', error);
      throw error;
    }
  }

  /**
   * Delete a stock movement
   * @param {string} movementId - Movement UUID
   * @returns {Promise<void>}
   */
  async deleteStockMovement(movementId) {
    try {
      const { error } = await supabase
        ?.from('stock_movements')
        ?.delete()
        ?.eq('id', movementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting stock movement:', error);
      throw error;
    }
  }

  /**
   * Get stock movements for a specific product
   * @param {string} productId - Product UUID
   * @returns {Promise<Array>} List of movements for the product
   */
  async getProductMovements(productId) {
    try {
      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.select(`
          *,
          product:products(
            id,
            name,
            sku,
            image_url,
            category
          ),
          user:user_profiles(
            id,
            full_name
          )
        `)
        ?.eq('product_id', productId)
        ?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(movement => this.convertToCamelCase(movement)) || [];
    } catch (error) {
      console.error('Error fetching product movements:', error);
      throw error;
    }
  }

  /**
   * Convert database snake_case to React camelCase
   */
  convertToCamelCase(movement) {
    if (!movement) return null;
    
    return {
      id: movement?.id,
      companyId: movement?.company_id,
      productId: movement?.product_id,
      type: movement?.type,
      quantity: movement?.quantity,
      runningBalance: movement?.running_balance,
      location: movement?.location,
      reason: movement?.reason,
      createdBy: movement?.created_by,
      createdAt: movement?.created_at,
      updatedAt: movement?.updated_at,
      product: movement?.product ? {
        id: movement?.product?.id,
        name: movement?.product?.name,
        sku: movement?.product?.sku,
        imageUrl: movement?.product?.image_url,
        category: movement?.product?.category
      } : null,
      user: movement?.user ? {
        id: movement?.user?.id,
        fullName: movement?.user?.full_name
      } : null
    };
  }

  /**
   * Convert React camelCase to database snake_case
   */
  convertToSnakeCase(movement) {
    const snakeCase = {};
    
    if (movement?.productId !== undefined) snakeCase.product_id = movement?.productId;
    if (movement?.type !== undefined) snakeCase.type = movement?.type;
    if (movement?.quantity !== undefined) snakeCase.quantity = movement?.quantity;
    if (movement?.runningBalance !== undefined) snakeCase.running_balance = movement?.runningBalance;
    if (movement?.location !== undefined) snakeCase.location = movement?.location;
    if (movement?.reason !== undefined) snakeCase.reason = movement?.reason;
    
    return snakeCase;
  }
}

export default new StockMovementService();
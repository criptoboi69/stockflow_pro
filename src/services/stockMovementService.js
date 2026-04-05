import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

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
      logger.error('Error fetching stock movements:', error);
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
      logger.error('Error fetching stock movement:', error);
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
      const productId = movementData?.productId;
      const quantityDelta = Number(movementData?.quantity || 0);

      if (!productId) {
        throw new Error('Produit manquant pour créer le mouvement');
      }

      const { data: existingProduct, error: productError } = await supabase
        ?.from('products')
        ?.select('id, quantity')
        ?.eq('id', productId)
        ?.single();

      if (productError) throw productError;

      const currentQuantity = Number(existingProduct?.quantity || 0);
      const nextQuantity = currentQuantity + quantityDelta;

      if (nextQuantity < 0) {
        throw new Error('Stock insuffisant pour effectuer ce mouvement');
      }

      const normalizedMovementData = {
        ...movementData,
        previousQuantity: currentQuantity,
        newQuantity: nextQuantity,
        type: quantityDelta >= 0 ? 'in' : 'out',
      };

      const snakeCaseData = this.convertToSnakeCase(normalizedMovementData);

      const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
      const insertPayload = {
        ...snakeCaseData,
        company_id: companyId,
      };

      if (isUuid(userId)) {
        insertPayload.created_by = userId;
      }

      const { data, error } = await supabase
        ?.from('stock_movements')
        ?.insert(insertPayload)
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

      const { error: updateProductError } = await supabase
        ?.from('products')
        ?.update({ quantity: nextQuantity })
        ?.eq('id', productId);

      if (updateProductError) throw updateProductError;

      return this.convertToCamelCase(data);
    } catch (error) {
      logger.error('Error creating stock movement:', error);
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
      logger.error('Error updating stock movement:', error);
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
      logger.error('Error deleting stock movement:', error);
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
      logger.error('Error fetching product movements:', error);
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
      type: movement?.type === 'in' ? 'receipt' : movement?.type === 'out' ? 'issue' : movement?.type,
      quantity: Number(movement?.quantity),
      previousQuantity: Number(movement?.previous_quantity),
      newQuantity: Number(movement?.new_quantity),
      runningBalance: Number(movement?.new_quantity),
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
    if (movement?.type !== undefined) snakeCase.type = movement?.type === 'receipt' ? 'in' : movement?.type === 'issue' ? 'out' : movement?.type;
    if (movement?.quantity !== undefined) snakeCase.quantity = Number(movement?.quantity);
    if (movement?.previousQuantity !== undefined) snakeCase.previous_quantity = Number(movement?.previousQuantity);
    if (movement?.newQuantity !== undefined) snakeCase.new_quantity = Number(movement?.newQuantity);
    if (movement?.location !== undefined) snakeCase.location = movement?.location;
    if (movement?.reason !== undefined) snakeCase.reason = movement?.reason;
    
    return snakeCase;
  }
}

export default new StockMovementService();
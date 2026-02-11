import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'product-images';

class StorageService {
  /**
   * Upload a product image to Supabase storage
   * @param {File} file - The image file to upload
   * @param {string} productId - Unique product identifier
   * @returns {Promise<{filePath: string, publicUrl: string}>}
   */
  async uploadProductImage(file, productId) {
    try {
      // Generate unique file path
      const timestamp = Date.now();
      const fileExt = file?.name?.split('.')?.pop();
      const fileName = `${productId}_${timestamp}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload file
      const { data, error } = await supabase?.storage?.from(BUCKET_NAME)?.upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase?.storage?.from(BUCKET_NAME)?.getPublicUrl(filePath);

      return { filePath: data?.path, publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a product image
   * @param {string} filePath - The file path in storage
   * @returns {string} Public URL
   */
  getPublicUrl(filePath) {
    if (!filePath) return null;
    
    const { data: { publicUrl } } = supabase?.storage?.from(BUCKET_NAME)?.getPublicUrl(filePath);
    
    return publicUrl;
  }

  /**
   * Delete a product image from storage
   * @param {string} filePath - The file path to delete
   * @returns {Promise<void>}
   */
  async deleteProductImage(filePath) {
    try {
      if (!filePath) return;

      const { error } = await supabase?.storage?.from(BUCKET_NAME)?.remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  /**
   * List all images for a product
   * @param {string} productId - Product identifier
   * @returns {Promise<Array>} List of image files
   */
  async listProductImages(productId) {
    try {
      const { data, error } = await supabase?.storage?.from(BUCKET_NAME)?.list('products', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) throw error;

      // Filter by product ID
      return data?.filter(file => file?.name?.startsWith(productId)) || [];
    } catch (error) {
      console.error('List error:', error);
      return [];
    }
  }
}

export default new StorageService();

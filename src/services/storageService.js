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
      if (!file) throw new Error('Aucun fichier image fourni');

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
      if (!(allowedTypes.includes(file.type) || String(file.type || '').startsWith('image/'))) {
        throw new Error('Type de fichier non supporté');
      }

      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 20MB)');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId);

      console.log('[upload] file selected', {
        name: file?.name,
        type: file?.type,
        size: file?.size,
        productId
      });

      const uploadEndpoint = '/api/upload-product-image';
      console.log('[upload] request started', { endpoint: uploadEndpoint });
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json();
      console.log('[upload] response received', { ok: response.ok, status: response.status, payload });
      if (!response.ok) {
        throw new Error(payload?.error || 'Échec upload image');
      }

      return { filePath: payload.filePath, publicUrl: payload.publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error?.message || error?.error_description || error?.details || JSON.stringify(error) || 'Échec upload image';
      throw new Error(msg);
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

      if (error) { console.error('[Storage upload supabase error]', error); throw error; }
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

      if (error) { console.error('[Storage upload supabase error]', error); throw error; }

      // Filter by product ID
      return data?.filter(file => file?.name?.startsWith(productId)) || [];
    } catch (error) {
      console.error('List error:', error);
      return [];
    }
  }
}

export default new StorageService();

import { supabase } from '../lib/supabase';

class LocationService {
  /**
   * Get all locations for the current company
   * @param {string} companyId - Company UUID
   * @returns {Promise<Array>} List of locations in camelCase
   */
  async getLocations(companyId) {
    try {
      const { data, error } = await supabase
        ?.from('locations')
        ?.select('*')
        ?.eq('company_id', companyId)
        ?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(location => this.convertToCamelCase(location)) || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Get a single location by ID
   * @param {string} locationId - Location UUID
   * @returns {Promise<Object>} Location data
   */
  async getLocation(locationId) {
    try {
      const { data, error } = await supabase
        ?.from('locations')
        ?.select('*')
        ?.eq('id', locationId)
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }

  /**
   * Create a new location
   * @param {Object} locationData - Location data in camelCase
   * @param {string} companyId - Company UUID
   * @returns {Promise<Object>} Created location
   */
  async createLocation(locationData, companyId) {
    try {
      const snakeCaseData = this.convertToSnakeCase(locationData);
      
      const payload = {
        ...snakeCaseData,
        company_id: companyId
      };

      const { data, error } = await supabase
        ?.from('locations')
        ?.insert(payload)
        ?.select()
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * Update an existing location
   * @param {string} locationId - Location UUID
   * @param {Object} locationData - Updated location data in camelCase
   * @returns {Promise<Object>} Updated location
   */
  async updateLocation(locationId, locationData) {
    try {
      const snakeCaseData = this.convertToSnakeCase(locationData);
      
      const { data, error } = await supabase
        ?.from('locations')
        ?.update(snakeCaseData)
        ?.eq('id', locationId)
        ?.select()
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param {string} locationId - Location UUID
   * @param {string} companyId - Company UUID for extra safety
   * @returns {Promise<void>}
   */
  async deleteLocation(locationId, companyId) {
    try {
      let query = supabase
        ?.from('locations')
        ?.delete()
        ?.eq('id', locationId);

      if (companyId) {
        query = query?.eq('company_id', companyId);
      }

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Convert database snake_case to React camelCase
   */
  convertToCamelCase(location) {
    if (!location) return null;
    
    return {
      id: location?.id,
      companyId: location?.company_id,
      name: location?.name,
      code: location?.code,
      type: location?.type,
      status: location?.status,
      description: location?.description,
      address: location?.address,
      capacity: location?.capacity,
      occupancy: location?.occupancy,
      manager: location?.manager,
      phone: location?.phone,
      email: location?.email,
      imageUrl: location?.image_url,
      imageFilePath: location?.image_file_path,
      imageUrls: Array.isArray(location?.image_urls) ? location.image_urls : [],
      imageFilePaths: Array.isArray(location?.image_file_paths) ? location.image_file_paths : [],
      createdAt: location?.created_at,
      updatedAt: location?.updated_at
    };
  }

  /**
   * Convert React camelCase to database snake_case
   */
  convertToSnakeCase(location) {
    const snakeCase = {};
    
    if (location?.name !== undefined) snakeCase.name = location?.name;
    if (location?.code !== undefined) snakeCase.code = location?.code;
    if (location?.type !== undefined) snakeCase.type = location?.type;
    if (location?.status !== undefined) snakeCase.status = location?.status;
    if (location?.description !== undefined) snakeCase.description = location?.description;
    if (location?.address !== undefined) snakeCase.address = location?.address;
    if (location?.capacity !== undefined) {
      const cap = Number(location?.capacity);
      snakeCase.capacity = Number.isFinite(cap) ? cap : null;
    }
    if (location?.occupancy !== undefined) {
      const occ = Number(location?.occupancy);
      snakeCase.occupancy = Number.isFinite(occ) ? occ : 0;
    }
    if (location?.manager !== undefined) snakeCase.manager = location?.manager;
    if (location?.phone !== undefined) snakeCase.phone = location?.phone;
    if (location?.email !== undefined) snakeCase.email = location?.email;
    if (location?.imageUrl !== undefined) snakeCase.image_url = location?.imageUrl;
    if (location?.imageFilePath !== undefined) snakeCase.image_file_path = location?.imageFilePath;
    if (location?.imageUrls !== undefined) snakeCase.image_urls = location?.imageUrls;
    if (location?.imageFilePaths !== undefined) snakeCase.image_file_paths = location?.imageFilePaths;
    
    return snakeCase;
  }
}

export default new LocationService();

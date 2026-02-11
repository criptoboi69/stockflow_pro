import { supabase } from '../lib/supabase';

class AuditLogService {
  /**
   * Get all audit logs for the current company
   * @param {string} companyId - Company UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of audit logs
   */
  async getAuditLogs(companyId, filters = {}) {
    try {
      let query = supabase
        ?.from('audit_logs')
        ?.select(`
          *,
          user:user_profiles(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        ?.eq('company_id', companyId);

      // Apply filters
      if (filters?.actionType) {
        query = query?.eq('action_type', filters?.actionType);
      }

      if (filters?.entityType) {
        query = query?.eq('entity_type', filters?.entityType);
      }

      if (filters?.userId) {
        query = query?.eq('user_id', filters?.userId);
      }

      if (filters?.dateFrom) {
        query = query?.gte('created_at', filters?.dateFrom);
      }

      if (filters?.dateTo) {
        query = query?.lte('created_at', filters?.dateTo);
      }

      if (filters?.search) {
        query = query?.or(`description.ilike.%${filters?.search}%,entity_name.ilike.%${filters?.search}%`);
      }

      // Order by created_at descending
      query = query?.order('created_at', { ascending: false });

      // Apply limit if provided
      if (filters?.limit) {
        query = query?.limit(filters?.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(log => this.convertToCamelCase(log)) || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get a single audit log by ID
   * @param {string} logId - Audit log UUID
   * @returns {Promise<Object>} Audit log data
   */
  async getAuditLog(logId) {
    try {
      const { data, error } = await supabase
        ?.from('audit_logs')
        ?.select(`
          *,
          user:user_profiles(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        ?.eq('id', logId)
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw error;
    }
  }

  /**
   * Create a new audit log entry
   * @param {Object} logData - Audit log data
   * @returns {Promise<Object>} Created audit log
   */
  async createAuditLog(logData) {
    try {
      const { data, error } = await supabase
        ?.from('audit_logs')
        ?.insert([this.convertToSnakeCase(logData)])
        ?.select()
        ?.single();

      if (error) throw error;

      return this.convertToCamelCase(data);
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   * @param {string} companyId - Company UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics data
   */
  async getAuditLogStats(companyId, filters = {}) {
    try {
      let query = supabase
        ?.from('audit_logs')
        ?.select('action_type', { count: 'exact' })
        ?.eq('company_id', companyId);

      if (filters?.dateFrom) {
        query = query?.gte('created_at', filters?.dateFrom);
      }

      if (filters?.dateTo) {
        query = query?.lte('created_at', filters?.dateTo);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Count by action type
      const actionTypeCounts = {};
      data?.forEach(log => {
        const actionType = log?.action_type;
        actionTypeCounts[actionType] = (actionTypeCounts?.[actionType] || 0) + 1;
      });

      return {
        totalLogs: count || 0,
        actionTypeCounts
      };
    } catch (error) {
      console.error('Error fetching audit log stats:', error);
      throw error;
    }
  }

  /**
   * Get unique users from audit logs
   * @param {string} companyId - Company UUID
   * @returns {Promise<Array>} List of unique users
   */
  async getAuditLogUsers(companyId) {
    try {
      const { data, error } = await supabase
        ?.from('audit_logs')
        ?.select(`
          user:user_profiles(
            id,
            full_name,
            email
          )
        `)
        ?.eq('company_id', companyId)
        ?.not('user_id', 'is', null);

      if (error) throw error;

      // Get unique users
      const uniqueUsers = [];
      const userIds = new Set();

      data?.forEach(log => {
        if (log?.user && !userIds?.has(log?.user?.id)) {
          userIds?.add(log?.user?.id);
          uniqueUsers?.push({
            id: log?.user?.id,
            fullName: log?.user?.full_name,
            email: log?.user?.email
          });
        }
      });

      return uniqueUsers;
    } catch (error) {
      console.error('Error fetching audit log users:', error);
      throw error;
    }
  }

  /**
   * Convert snake_case to camelCase
   */
  convertToCamelCase(obj) {
    if (!obj) return obj;

    const camelCaseObj = {
      id: obj?.id,
      companyId: obj?.company_id,
      userId: obj?.user_id,
      actionType: obj?.action_type,
      entityType: obj?.entity_type,
      entityId: obj?.entity_id,
      entityName: obj?.entity_name,
      description: obj?.description,
      metadata: obj?.metadata,
      ipAddress: obj?.ip_address,
      userAgent: obj?.user_agent,
      createdAt: obj?.created_at,
      user: obj?.user ? {
        id: obj?.user?.id,
        fullName: obj?.user?.full_name,
        email: obj?.user?.email,
        avatarUrl: obj?.user?.avatar_url
      } : null
    };

    return camelCaseObj;
  }

  /**
   * Convert camelCase to snake_case
   */
  convertToSnakeCase(obj) {
    if (!obj) return obj;

    return {
      company_id: obj?.companyId,
      user_id: obj?.userId,
      action_type: obj?.actionType,
      entity_type: obj?.entityType,
      entity_id: obj?.entityId,
      entity_name: obj?.entityName,
      description: obj?.description,
      metadata: obj?.metadata,
      ip_address: obj?.ipAddress,
      user_agent: obj?.userAgent
    };
  }
}

export default new AuditLogService();
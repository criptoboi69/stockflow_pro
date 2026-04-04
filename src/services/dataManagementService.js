import { supabase } from '../lib/supabase';

class DataManagementService {
  async listOperations(companyId) {
    const { data, error } = await supabase
      .from('data_operations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async logOperation({ companyId, createdBy, type, payload = {}, userEmail = null, userName = null, filename = null, format = null }) {
    const { data, error } = await supabase
      .from('data_operations')
      .insert({
        company_id: companyId,
        user_id: createdBy || null,
        user_email: userEmail,
        user_name: userName,
        type,
        status: 'completed',
        filename,
        format,
        results: payload,
        logs: [],
        config: { source: 'data-management-service' }
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

export default new DataManagementService();

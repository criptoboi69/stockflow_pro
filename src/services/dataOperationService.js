import { supabase } from '../lib/supabase';

const dataOperationService = {
  async list(companyId) {
    try {
      const { data, error } = await supabase
        .from('data_operations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error listing data operations:', error);
      return { data: [], error };
    }
  },

  async create(payload) {
    try {
      const { data, error } = await supabase
        .from('data_operations')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating data operation:', error);
      return { data: null, error };
    }
  },

  async update(id, patch) {
    try {
      const { data, error } = await supabase
        .from('data_operations')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating data operation:', error);
      return { data: null, error };
    }
  }
};

export default dataOperationService;

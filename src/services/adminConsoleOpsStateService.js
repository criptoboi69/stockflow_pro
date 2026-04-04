import { supabase } from '../lib/supabase';

class AdminConsoleOpsStateService {
  async list(scope, companyId = null) {
    let query = supabase
      .from('admin_console_ops_state')
      .select('id,company_id,scope,item_key,status,owner,note,updated_by,updated_at,created_at')
      .eq('scope', scope)
      .order('updated_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async upsert(entry) {
    const payload = {
      company_id: entry.company_id || null,
      scope: entry.scope,
      item_key: entry.item_key,
      status: entry.status || null,
      owner: entry.owner || null,
      note: entry.note || null,
      updated_by: entry.updated_by || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('admin_console_ops_state')
      .upsert(payload, { onConflict: 'company_id,scope,item_key' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default new AdminConsoleOpsStateService();

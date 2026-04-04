import { supabase } from '../lib/supabase';

export const settingsService = {
  async getCompanySettings(companyId) {
    try {
      const { data, error } = await supabase
        ?.from('companies')
        ?.select('settings')
        ?.eq('id', companyId)
        ?.single();
      if (error) throw error;
      return { data: data?.settings || {}, error: null };
    } catch (error) {
      console.error('Error fetching company settings:', error);
      return { data: {}, error };
    }
  },

  async updateCompanySettings(companyId, section, sectionData) {
    try {
      const { data: current, error: fetchError } = await supabase
        ?.from('companies')
        ?.select('settings')
        ?.eq('id', companyId)
        ?.single();
      if (fetchError) throw fetchError;

      const nextSettings = {
        ...(current?.settings || {}),
        [section]: sectionData
      };

      const { data, error } = await supabase
        ?.from('companies')
        ?.update({ settings: nextSettings })
        ?.eq('id', companyId)
        ?.select('settings')
        ?.single();
      if (error) throw error;
      return { data: data?.settings || {}, error: null };
    } catch (error) {
      console.error('Error updating company settings:', error);
      return { data: null, error };
    }
  },

  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('id, email, first_name, last_name, full_name, phone, avatar_url, preferences')
        ?.eq('id', userId)
        ?.single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return { data: null, error };
    }
  },

  
  async uploadAvatar(userId, file) {
    try {
      const ext = (file?.name?.split('.')?.pop() || 'jpg').toLowerCase();
      const path = `avatars/${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      return { data: data?.publicUrl || '', error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { data: null, error };
    }
  },

  async updateUserPreferences(userId, payload) {
    try {
      const { profile = {}, preferences = {} } = payload || {};
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || profile?.fullName || '';

      const updatePayload = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone: profile?.phone,
        avatar_url: profile?.avatar,
        preferences
      };

      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.update(updatePayload)
        ?.eq('id', userId)
        ?.select('*')
        ?.single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { data: null, error };
    }
  }
};

export default settingsService;

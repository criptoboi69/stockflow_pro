import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

export const userService = {
  async getCompanyUsers(companyId) {
    try {
      const { data, error } = await supabase?.from('user_company_roles')?.select(`
          id,
          role,
          is_primary,
          created_at,
          user_profiles (
            id,
            email,
            full_name,
            avatar_url,
            phone,
            is_active,
            created_at
          )
        `)?.eq('company_id', companyId)?.order('created_at', { ascending: false });

      if (error) throw error;

      const users = data?.map(item => ({
        id: item?.user_profiles?.id,
        email: item?.user_profiles?.email,
        fullName: item?.user_profiles?.full_name,
        avatarUrl: item?.user_profiles?.avatar_url,
        phone: item?.user_profiles?.phone,
        isActive: item?.user_profiles?.is_active,
        role: item?.role,
        isPrimary: item?.is_primary,
        createdAt: item?.created_at
      })) || [];

      return { data: users, error: null };
    } catch (error) {
      console.error('Error fetching company users:', error);
      return { data: null, error };
    }
  },

  async inviteUser(invitationData) {
    try {
      const { email, companyId, role, invitedBy, companyName, inviterName } = invitationData;

      const token = btoa(`${email}-${Date.now()}-${Math.random()}`);
      const expiresAt = new Date();
      expiresAt?.setDate(expiresAt?.getDate() + 7);

      const { data, error } = await supabase?.from('invitations')?.insert({
          email,
          company_id: companyId,
          role,
          invited_by: invitedBy,
          token,
          expires_at: expiresAt?.toISOString(),
          status: 'pending'
        })?.select()?.single();

      if (error) throw error;

      await emailService?.sendInvitation({
        email,
        companyName,
        role,
        inviterName,
        token
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { data: null, error };
    }
  },

  async getCompanyInvitations(companyId) {
    try {
      const { data, error } = await supabase?.from('invitations')?.select(`
          *,
          inviter:user_profiles!invited_by (
            full_name,
            email
          )
        `)?.eq('company_id', companyId)?.order('created_at', { ascending: false });

      if (error) throw error;

      const invitations = data?.map(inv => ({
        id: inv?.id,
        email: inv?.email,
        role: inv?.role,
        status: inv?.status,
        inviterName: inv?.inviter?.full_name,
        inviterEmail: inv?.inviter?.email,
        expiresAt: inv?.expires_at,
        createdAt: inv?.created_at
      })) || [];

      return { data: invitations, error: null };
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return { data: null, error };
    }
  },

  async updateUserRole(userId, companyId, newRole) {
    try {
      const { data, error } = await supabase?.from('user_company_roles')?.update({ role: newRole, updated_at: new Date()?.toISOString() })?.eq('user_id', userId)?.eq('company_id', companyId)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { data: null, error };
    }
  },

  async toggleUserStatus(userId) {
    try {
      const { data: currentUser, error: fetchError } = await supabase?.from('user_profiles')?.select('is_active')?.eq('id', userId)?.single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase?.from('user_profiles')?.update({ 
          is_active: !currentUser?.is_active,
          updated_at: new Date()?.toISOString()
        })?.eq('id', userId)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { data: null, error };
    }
  },

  async removeUserFromCompany(userId, companyId) {
    try {
      const { error } = await supabase?.from('user_company_roles')?.delete()?.eq('user_id', userId)?.eq('company_id', companyId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error removing user from company:', error);
      return { error };
    }
  },

  async cancelInvitation(invitationId) {
    try {
      const { error } = await supabase?.from('invitations')?.update({ status: 'cancelled' })?.eq('id', invitationId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      return { error };
    }
  }
};
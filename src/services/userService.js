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
            first_name,
            last_name,
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
        firstName: item?.user_profiles?.first_name,
        lastName: item?.user_profiles?.last_name,
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
      const { email, companyId, role, invitedBy, firstName, lastName, companyName, inviterName } = invitationData;

      // Generate unique token
      const token = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

      // Create invitation (not the user yet)
      const { data: invitation, error: inviteError } = await supabase?.from('invitations')?.insert({
          email,
          first_name: firstName,
          last_name: lastName,
          company_id: companyId,
          role,
          invited_by: invitedBy,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })?.select()?.single();

      if (inviteError) throw inviteError;

      const acceptUrl = `${window.location.origin}/accept-invitation?token=${token}`;

      // Send invitation email via Supabase Edge Function
      try {
        const edgeFunctionUrl = `${window.location.origin.replace("100.66.171.51:4028", "100.66.171.51:54321")}/functions/v1/send-invitation`;
        await fetch(edgeFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE`
          },
          body: JSON.stringify({
            email,
            firstName: firstName || "",
            lastName: lastName || "",
            roleName: role === "super_admin" ? "Super Admin" : role === "admin" ? "Administrateur" : role === "manager" ? "Manager" : "Employé",
            companyName: companyName || "StockFlow",
            inviterName: inviterName || "L'équipe StockFlow",
            acceptUrl
          })
        });
      } catch (emailError) {
        console.warn("Failed to send invitation email:", emailError);
        // Don't fail the invitation if email fails
      }

      return { 
        data: { 
          invitation,
          acceptUrl
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { data: null, error };
    }
  },

  async acceptInvitation(token, password) {
    try {
      // Verify invitation exists and is valid
      const { data: invitation, error: fetchError } = await supabase?.from('invitations')?.select('*')?.eq('token', token)?.single();

      if (fetchError || !invitation) {
        throw new Error('Invitation invalide ou expirée');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Cette invitation a déjà été utilisée');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Cette invitation a expiré');
      }

      // Create user profile via Supabase Auth (this would need auth admin)
      // For now, create in user_profiles and mark invitation as accepted
      const userId = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

      const { data: profile, error: profileError } = await supabase?.from('user_profiles')?.insert({
          id: userId,
          email: invitation.email,
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          full_name: `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim(),
          is_active: true,
          created_at: new Date().toISOString()
        })?.select()?.single();

      if (profileError) throw profileError;

      // Create company role
      const { error: roleError } = await supabase?.from('user_company_roles')?.insert({
          user_id: userId,
          company_id: invitation.company_id,
          role: invitation.role,
          is_primary: false,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (roleError) throw roleError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase?.from('invitations')?.update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('token', token);

      if (updateError) throw updateError;

      return { data: { userId, email: invitation.email }, error: null };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { data: null, error };
    }
  },

  async checkInvitation(token) {
    try {
      const { data: invitation, error } = await supabase?.from('invitations')?.select('*')?.eq('token', token)?.single();

      if (error || !invitation) {
        return { data: null, error: new Error('Invitation invalide') };
      }

      const isExpired = new Date(invitation.expires_at) < new Date();
      const isValid = invitation.status === 'pending' && !isExpired;

      return { 
        data: { 
          ...invitation, 
          isValid,
          isExpired,
          companyName: invitation.company_id // Would need join to get actual name
        }, 
        error: null 
      };
    } catch (error) {
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
      const { data, error } = await supabase?.from('user_company_roles')?.update({ role: newRole })?.eq('user_id', userId)?.eq('company_id', companyId)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { data: null, error };
    }
  },

  async updateUser(userId, updates) {
    try {
      const payload = {
        first_name: updates?.firstName,
        last_name: updates?.lastName,
        full_name: `${updates?.firstName || ''} ${updates?.lastName || ''}`.trim(),
        phone: updates?.phone
      };

      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.update(payload)
        ?.eq('id', userId)
        ?.select()
        ?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  },

  async toggleUserStatus(userId) {
    try {
      const { data: currentUser, error: fetchError } = await supabase?.from('user_profiles')?.select('is_active')?.eq('id', userId)?.single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase?.from('user_profiles')?.update({ 
          is_active: !currentUser?.is_active
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
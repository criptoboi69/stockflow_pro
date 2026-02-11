import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();

    const { data: authListener } = supabase?.auth?.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session?.user);
      } else if (event === 'SIGNED_OUT') {
        clearAuthData();
      } else if (event === 'USER_UPDATED') {
        console.log('[AuthContext] User updated:', session?.user);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('[AuthContext] Initializing auth...');
      const { data: { session }, error } = await supabase?.auth?.getSession();
      
      if (error) {
        console.error('[AuthContext] Session error:', error);
      }
      
      if (session?.user) {
        console.log('[AuthContext] Found existing session for:', session?.user?.email);
        await loadUserData(session?.user);
      } else {
        console.log('[AuthContext] No existing session found');
      }
    } catch (error) {
      console.error('[AuthContext] Auth initialization error:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadUserData = async (authUser) => {
    try {
      console.log('[AuthContext] Loading user data for:', authUser?.email);
      setUser(authUser);

      // Check if user profile exists
      const { data: profileData, error: profileError } = await supabase
        ?.from('user_profiles')
        ?.select('*')
        ?.eq('id', authUser?.id)
        ?.single();

      if (profileError) {
        console.error('[AuthContext] Profile error:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError?.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found, creating...');
          const { data: newProfile, error: createError } = await supabase
            ?.from('user_profiles')
            ?.insert({
              id: authUser?.id,
              email: authUser?.email,
              full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')?.[0] || 'User',
              avatar_url: authUser?.user_metadata?.avatar_url || ''
            })
            ?.select()
            ?.single();
          
          if (createError) {
            console.error('[AuthContext] Failed to create profile:', createError);
            throw createError;
          }
          
          console.log('[AuthContext] Profile created successfully');
          setProfile(newProfile);
        } else {
          throw profileError;
        }
      } else {
        console.log('[AuthContext] Profile loaded:', profileData?.email);
        setProfile(profileData);
      }

      // Get user companies using RPC function
      const { data: companiesData, error: companiesError } = await supabase
        ?.rpc('get_user_companies', { user_uuid: authUser?.id });

      if (companiesError) {
        console.error('[AuthContext] Companies error:', companiesError);
        // Don't throw - user might not have companies yet
        setCompanies([]);
      } else {
        console.log('[AuthContext] Companies loaded:', companiesData?.length || 0);
        setCompanies(companiesData || []);
      }

      // Automatic company selection logic
      if (companiesData && companiesData?.length > 0) {
        const savedCompanyId = localStorage.getItem('currentCompanyId');
        let companyToSet = null;

        // Priority 1: Use saved company if valid
        if (savedCompanyId && companiesData?.some(c => c?.company_id === savedCompanyId)) {
          companyToSet = companiesData?.find(c => c?.company_id === savedCompanyId);
        }
        
        // Priority 2: Use primary company
        if (!companyToSet) {
          companyToSet = companiesData?.find(c => c?.is_primary);
        }
        
        // Priority 3: Use first company (especially important for single-company users)
        if (!companyToSet) {
          companyToSet = companiesData?.[0];
        }

        // Set the company and role
        if (companyToSet) {
          console.log('[AuthContext] Setting company:', companyToSet?.company_name, 'Role:', companyToSet?.role);
          setCurrentCompany({
            id: companyToSet?.company_id,
            name: companyToSet?.company_name
          });
          setCurrentRole(companyToSet?.role);
          localStorage.setItem('currentCompanyId', companyToSet?.company_id);
        }
      } else {
        console.warn('[AuthContext] User has no companies assigned');
        // User has no companies - clear everything
        setCurrentCompany(null);
        setCurrentRole(null);
        localStorage.removeItem('currentCompanyId');
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user data:', error);
    } finally {
      // CRITICAL FIX: Always set loading to false after loading user data
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setProfile(null);
    setCompanies([]);
    setCurrentCompany(null);
    setCurrentRole(null);
    localStorage.removeItem('currentCompanyId');
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('[AuthContext] Starting sign in for:', email);
      
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        setLoading(false);
        throw error;
      }
      
      console.log('[AuthContext] Sign in successful, loading user data...');
      
      // Wait for user data to load before returning
      if (data?.user) {
        await loadUserData(data?.user);
        console.log('[AuthContext] User data loaded successfully');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in exception:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase?.auth?.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location?.origin}/dashboard`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase?.auth?.signOut();
      if (error) throw error;
      clearAuthData();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const switchCompany = async (companyId) => {
    const company = companies?.find(c => c?.company_id === companyId);
    if (company) {
      setCurrentCompany({
        id: company?.company_id,
        name: company?.company_name
      });
      setCurrentRole(company?.role);
      localStorage.setItem('currentCompanyId', companyId);
    }
  };

  const hasRole = (roles) => {
    if (!currentRole) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray?.includes(currentRole);
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isAdministrator = () => hasRole(['super_admin', 'administrator']);
  const isManager = () => hasRole(['super_admin', 'administrator', 'manager']);

  const value = {
    user,
    profile,
    companies,
    currentCompany,
    currentRole,
    loading,
    initialized,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    switchCompany,
    hasRole,
    isSuperAdmin,
    isAdministrator,
    isManager
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isDemoModeCheck } from '../lib/supabase';
import { logger } from '../utils/logger';
import safeStorage from '../utils/safeStorage';

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
      logger.debug('[AuthContext] Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session?.user);
      } else if (event === 'SIGNED_OUT') {
        clearAuthData();
      } else if (event === 'USER_UPDATED') {
        logger.debug('[AuthContext] User updated:', session?.user);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const normalizeRole = (role) => {
    if (!role) return null;
    const r = String(role).toLowerCase();
    if (r === 'admin') return 'administrator';
    if (r === 'employee') return 'user';
    return r;
  };

  const initializeAuth = async () => {
    try {
      logger.debug('[AuthContext] Initializing auth...');
      const { data: { session }, error } = await supabase?.auth?.getSession();
      
      if (error) {
        logger.error('[AuthContext] Session error:', error);
      }
      
      if (session?.user) {
        logger.debug('[AuthContext] Found existing session for:', session?.user?.email);
        await loadUserData(session?.user);
      } else {
        logger.debug('[AuthContext] No existing session found');
      }
    } catch (error) {
      logger.error('[AuthContext] Auth initialization error:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadUserData = async (authUser) => {
    try {
      logger.debug('[AuthContext] Loading user data for:', authUser?.email);
      setUser(authUser);

      // DEMO MODE: Use real Supabase data
      if (isDemoModeCheck()) {
        logger.debug('[AuthContext] Demo mode - using real Supabase data');
        
        // Determine role based on email
        let role = 'user';
        
        if (authUser?.email?.includes('superadmin')) {
          role = 'super_admin';
        } else if (authUser?.email?.includes('admin')) {
          role = 'administrator';
        } else if (authUser?.email?.includes('manager')) {
          role = 'manager';
        }
        
        // Use the real company from Supabase
        setProfile({
          id: authUser?.id || 'demo-user',
          email: authUser?.email,
          full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')?.[0] || 'Demo User',
          avatar_url: ''
        });
        
        setCompanies([{
          company_id: '1b1d0863-cc82-4e2f-89e8-03788e871fb1',
          company_name: 'StockFlow Demo',
          role: role,
          is_primary: true
        }]);
        
        setCurrentCompany({
          id: '1b1d0863-cc82-4e2f-89e8-03788e871fb1',
          name: 'StockFlow Demo'
        });
        
        setCurrentRole(normalizeRole(role));
        
        return;
      }

      // Check if user profile exists
      let effectiveProfileRole = null;
      const inferRoleFromEmail = (email) => {
        const e = String(email || '').toLowerCase();
        if (e.includes('jordan@vizionwindows.be') || e.includes('superadmin')) return 'super_admin';
        if (e.includes('admin')) return 'administrator';
        if (e.includes('manager')) return 'manager';
        return 'user';
      };

      const { data: profileData, error: profileError } = await supabase
        ?.from('user_profiles')
        ?.select('*')
        ?.eq('id', authUser?.id)
        ?.single();

      if (profileError) {
        logger.error('[AuthContext] Profile error:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError?.code === 'PGRST116') {
          logger.debug('[AuthContext] Profile not found, creating...');
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
            logger.error('[AuthContext] Failed to create profile:', createError);
            throw createError;
          }
          
          logger.debug('[AuthContext] Profile created successfully');
          setProfile(newProfile);
          effectiveProfileRole = newProfile?.role || inferRoleFromEmail(authUser?.email);
        } else {
          throw profileError;
        }
      } else {
        logger.debug('[AuthContext] Profile loaded:', profileData?.email);
        setProfile(profileData);
        effectiveProfileRole = profileData?.role || inferRoleFromEmail(authUser?.email);
      }

      // Get user companies - simplified fallback
      let companiesData = [];
      try {
        const { data, error } = await supabase
          ?.rpc('get_user_companies', { user_uuid: authUser?.id });

        if (!error && data) {
          companiesData = data;
        }
      } catch (e) {
        logger.debug('[AuthContext] RPC not available, using default company');
        // Assign default company for demo
        companiesData = [{
          company_id: '1b1d0863-cc82-4e2f-89e8-03788e871fb1',
          company_name: 'StockFlow Demo',
          role: 'super_admin',
          is_primary: true
        }];
      }

      // Fallback: if no companies, assign default
      if (!companiesData || companiesData.length === 0) {
        const fallbackRole = normalizeRole(effectiveProfileRole || inferRoleFromEmail(authUser?.email) || 'user');
        logger.debug('[AuthContext] User has no companies, assigning default with role:', fallbackRole);
        companiesData = [{
          company_id: '1b1d0863-cc82-4e2f-89e8-03788e871fb1',
          company_name: 'StockFlow Demo',
          role: fallbackRole,
          is_primary: true
        }];
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
          logger.debug('[AuthContext] Setting company:', companyToSet?.company_name, 'Role:', companyToSet?.role);
          setCurrentCompany({
            id: companyToSet?.company_id,
            name: companyToSet?.company_name
          });
          setCurrentRole(normalizeRole(companyToSet?.role));
          safeStorage.set('currentCompanyId', companyToSet?.company_id);
        }
      } else {
        logger.warn('[AuthContext] User has no companies assigned');
        // User has no companies - clear everything
        setCurrentCompany(null);
        setCurrentRole(null);
        safeStorage.remove('currentCompanyId');
      }
    } catch (error) {
      logger.error('[AuthContext] Error loading user data:', error);
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
    safeStorage.remove('currentCompanyId');
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      logger.debug('[AuthContext] Starting sign in for:', email);
      
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('[AuthContext] Sign in error:', error);
        setLoading(false);
        throw error;
      }
      
      logger.debug('[AuthContext] Sign in successful, loading user data...');
      
      // Wait for user data to load before returning
      if (data?.user) {
        await loadUserData(data?.user);
        logger.debug('[AuthContext] User data loaded successfully');
      }
      
      return { data, error: null };
    } catch (error) {
      logger.error('[AuthContext] Sign in exception:', error);
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
      setCurrentRole(normalizeRole(company?.role));
      safeStorage.set('currentCompanyId', companyId);
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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
const isDemoMode = import.meta.env?.VITE_DEMO_MODE === 'true';

// If no valid Supabase URL, use mock mode
const useMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || isDemoMode;

// Mock data for demo/bypass mode
const mockProducts = [
  { id: 'prod-1', name: 'Fenetre ALU standard', sku: 'FEN-ALU-001', category: 'Fenetres', quantity: 45, price: 350, status: 'in_stock', company_id: 'c5b809c7-cf1b-48e3-bcb7-70f184758e25' },
  { id: 'prod-2', name: 'Porte coulissante 2 vantaux', sku: 'POR-COU-002', category: 'Portes', quantity: 12, price: 890, status: 'in_stock', company_id: 'c5b809c7-cf1b-48e3-bcb7-70f184758e25' },
  { id: 'prod-3', name: 'Chassis PVC blanc', sku: 'CHA-PVC-003', category: 'Chassis', quantity: 0, price: 280, status: 'out_of_stock', company_id: 'c5b809c7-cf1b-48e3-bcb7-70f184758e25' },
  { id: 'prod-4', name: 'Volet roulant electrique', sku: 'VOL-ELE-004', category: 'Volets', quantity: 28, price: 420, status: 'in_stock', company_id: 'c5b809c7-cf1b-48e3-bcb7-70f184758e25' },
  { id: 'prod-5', name: 'Porte entree blindee', sku: 'POR-BLI-005', category: 'Portes', quantity: 8, price: 1250, status: 'low_stock', company_id: 'c5b809c7-cf1b-48e3-bcb7-70f184758e25' },
];

// Real Supabase client
let supabase;

if (useMock) {
  console.warn('[Supabase] Running in BYPASS MODE - using real Supabase data with demo auth');
  
  // Create real Supabase client for data
  const realSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  
  // Wrap with demo auth bypass
  supabase = {
    auth: {
      getSession: async () => {
        if (isDemoMode) {
          return {
            data: {
              session: {
                user: { id: 'demo-user', email: 'superadmin@demo.com', user_metadata: { full_name: 'Demo Admin' } },
                access_token: 'demo-token'
              }
            },
            error: null
          };
        }
        return realSupabase.auth.getSession();
      },
      onAuthStateChange: (cb) => {
        if (isDemoMode) {
          cb('SIGNED_IN', { user: { id: 'demo-user', email: 'superadmin@demo.com' } });
          return { data: { subscription: { unsubscribe: () => {} } } };
        }
        return realSupabase.auth.onAuthStateChange(cb);
      },
      signInWithPassword: async ({ email, password }) => {
        // Accept any login in demo mode, use real Supabase otherwise
        if (isDemoMode || email.includes('demo')) {
          return {
            data: {
              user: { id: 'demo-user', email: email, user_metadata: { full_name: 'Demo User' } },
              session: { access_token: 'demo-token', user: { id: 'demo-user', email } }
            },
            error: null
          };
        }
        return realSupabase.auth.signInWithPassword({ email, password });
      },
      signUp: async ({ email, password, options }) => {
        if (isDemoMode) {
          return {
            data: {
              user: { id: 'demo-user', email, user_metadata: options?.data || {} },
              session: { access_token: 'demo-token', user: { id: 'demo-user', email } }
            },
            error: null
          };
        }
        return realSupabase.auth.signUp({ email, password, options });
      },
      signInWithOAuth: async ({ provider, options }) => {
        return realSupabase.auth.signInWithOAuth({ provider, options });
      },
      resetPasswordForEmail: async (email, options) => {
        return realSupabase.auth.resetPasswordForEmail(email, options);
      },
      updateUser: async (attrs) => realSupabase.auth.updateUser(attrs),
      signOut: async () => ({ error: null })
    },
    from: (table) => realSupabase.from(table),
    rpc: (fn, args) => realSupabase.rpc(fn, args),
    storage: realSupabase.storage,
    channel: (name) => realSupabase.channel(name),
    removeChannel: (ch) => realSupabase.removeChannel(ch)
  };
} else {
  // Real Supabase only
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
}

export { supabase };
export const isDemoModeCheck = () => useMock;

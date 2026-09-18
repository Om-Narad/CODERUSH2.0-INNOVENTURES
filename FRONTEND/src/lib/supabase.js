import { createClient } from '@supabase/supabase-js';

// Resolve Supabase project URL and Anon Key with strict validation & sanitization
const getSupabaseConfig = () => {
  const DEFAULT_URL = 'https://skwmkqqlntkdczyavhxp.supabase.co';
  const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrd21rcXFsbnRrZGN6eWF2aHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDI4NDAsImV4cCI6MjEwNTIxODg0MH0.HcbT0CKFTtKfkeUC1EQ4u1gATrm9lItGa6YC49KTgiQ';

  let url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
  let key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

  url = url.trim().replace(/\/+$/, '');

  // If the env variable was erroneously set to a local backend API (e.g. localhost or render) instead of Supabase
  if (!url.includes('.supabase.co') && !url.includes('localhost:54321')) {
    console.warn('[SentinelPlan Auth] Overriding invalid VITE_SUPABASE_URL with cloud project URL:', DEFAULT_URL);
    url = DEFAULT_URL;
  }

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

import { createClient } from '@supabase/supabase-js';

// Resolve Supabase project URL and Anon Key with strict validation & sanitization
const getSupabaseConfig = () => {
  const DEFAULT_URL = 'https://skwmkqqlntkdczyavhxp.supabase.co';
  const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrd21rcXFsbnRrZGN6eWF2aHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDI4NDAsImV4cCI6MjEwNTIxODg0MH0.HcbT0CKFTtKfkeUC1EQ4u1gATrm9lItGa6YC49KTgiQ';

  let rawUrl = import.meta.env.VITE_SUPABASE_URL;
  let rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let url = DEFAULT_URL;
  let key = (rawKey || '').trim().replace(/^["']|["']$/g, '') || DEFAULT_KEY;

  if (rawUrl) {
    let cleanRaw = rawUrl.trim().replace(/^["']|["']$/g, '');
    try {
      if (!cleanRaw.startsWith('http://') && !cleanRaw.startsWith('https://')) {
        cleanRaw = `https://${cleanRaw}`;
      }
      const parsed = new URL(cleanRaw);
      // Extract origin ONLY (e.g. https://xyz.supabase.co or http://localhost:54321)
      // This strips any appended paths like /auth/v1, /rest/v1, or trailing slashes
      const origin = parsed.origin;

      if (origin.includes('.supabase.co') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        url = origin;
      } else {
        console.warn('[SentinelPlan Auth] VITE_SUPABASE_URL does not look like a Supabase endpoint. Falling back to default cloud URL:', origin);
        url = DEFAULT_URL;
      }
    } catch (e) {
      console.warn('[SentinelPlan Auth] Invalid VITE_SUPABASE_URL provided, falling back to default cloud URL:', e.message);
      url = DEFAULT_URL;
    }
  }

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sentinelplan_supabase_auth',
  },
});


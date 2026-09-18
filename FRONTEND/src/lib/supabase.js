import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://skwmkqqlntkdczyavhxp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrd21rcXFsbnRrZGN6eWF2aHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDI4NDAsImV4cCI6MjEwNTIxODg0MH0.HcbT0CKFTtKfkeUC1EQ4u1gATrm9lItGa6YC49KTgiQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

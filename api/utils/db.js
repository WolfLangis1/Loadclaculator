import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for backend operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

console.log('✅ Supabase backend client initialized:', {
  url: process.env.SUPABASE_URL ? 'configured' : 'missing',
  key: (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY) ? 'configured' : 'missing'
});

export default supabase;

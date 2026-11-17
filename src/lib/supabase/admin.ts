import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client must only run on the server.');
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey ||
      serviceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      serviceRoleKey.startsWith('sb_publishable_')) {
    throw new Error('A private Supabase service role key is required.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

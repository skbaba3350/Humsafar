import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pmmphvzlotykaqldwbvz.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6-7Mj6OjZqwq5csDsZRSfw_i1itLxHm';

  return createBrowserClient(supabaseUrl, supabaseKey);
}

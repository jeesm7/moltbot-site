import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Get Supabase admin client (lazy initialized)
 * Uses service role key for admin operations
 */
export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase credentials');
    }
    
    adminClient = createClient(url, key);
  }
  return adminClient;
}

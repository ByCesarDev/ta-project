import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
};

export const supabaseAdmin = getSupabaseAdmin();

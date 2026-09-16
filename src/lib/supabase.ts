import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getBrowserSupabaseConfig,
  getServerSupabaseConfig,
} from '@/lib/supabase-config';

// Client server-side com service_role — usado APENAS nas API Routes (bypass RLS)
export function createServerSupabaseClient(): SupabaseClient {
  const config = getServerSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client público — usado no browser (queries client-side)
export function createBrowserSupabaseClient(): SupabaseClient {
  const config = getBrowserSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createClient(config.url, config.key);
}

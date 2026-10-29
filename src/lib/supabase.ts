import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getBrowserSupabaseConfig,
  getServerSupabaseConfig,
} from './supabase-config.ts';

let serverClientOverride: unknown = null;

export function setServerSupabaseClientOverride(client: unknown) {
  serverClientOverride = client;
}

// Client server-side com service_role — usado APENAS nas API Routes (bypass RLS)
export function createServerSupabaseClient(): SupabaseClient {
  if (serverClientOverride) {
    return serverClientOverride as SupabaseClient;
  }
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
export function createBrowserSupabaseClient(fetcher?: typeof fetch): SupabaseClient {
  const config = getBrowserSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createClient(config.url, config.key, fetcher ? { global: { fetch: fetcher } } : undefined);
}

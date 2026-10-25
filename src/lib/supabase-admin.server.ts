import { createClient } from '@supabase/supabase-js';
import type { AppLoadContext } from 'react-router';

/**
 * Cliente con service_role. Solo se usa en el servidor para operaciones que el
 * cliente no puede hacer (reportes, moderación, borrado de cuenta, rate limit).
 */
export function createSupabaseAdminClient(context: AppLoadContext) {
  const env = context.cloudflare.env;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

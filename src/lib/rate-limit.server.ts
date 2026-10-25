import type { AppLoadContext } from 'react-router';
import { createSupabaseAdminClient, getClientIp } from '@/lib/supabase-admin.server';

export async function consumeRateLimit(
  request: Request,
  context: AppLoadContext,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const admin = createSupabaseAdminClient(context);

  if (!admin) {
    return true;
  }

  const ip = getClientIp(request);
  const { data, error } = await admin.rpc('consume_rate_limit', {
    p_key: `${key}:${ip}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.warn('[rate-limit] no se pudo consultar', error.message);
    return true;
  }

  return Boolean(data);
}

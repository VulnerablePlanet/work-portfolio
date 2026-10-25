import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from '@supabase/ssr';
import type { AppLoadContext } from 'react-router';

export interface SupabaseServerClient {
  client: ReturnType<typeof createServerClient>;
  responseHeaders: Headers;
}

/**
 * Cliente de Supabase para loaders/actions. Devuelve null si el Worker no
 * tiene credenciales, de modo que el perfil público sigue funcionando.
 */
export function createSupabaseServerClient(
  request: Request,
  context: AppLoadContext,
): SupabaseServerClient | null {
  const env = context.cloudflare.env;

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return null;
  }

  const responseHeaders = new Headers();
  const client = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(request.headers.get('Cookie') ?? '').map(
          ({ name, value }) => ({ name, value: value ?? '' }),
        ),
      setAll: (cookiesToSet, cacheHeaders) => {
        for (const { name, value, options } of cookiesToSet) {
          responseHeaders.append(
            'Set-Cookie',
            serializeCookieHeader(name, value, options),
          );
        }

        for (const [key, value] of Object.entries(cacheHeaders)) {
          responseHeaders.set(key, value);
        }
      },
    },
  });

  return { client, responseHeaders };
}

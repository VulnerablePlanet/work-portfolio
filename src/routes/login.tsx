import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from 'react-router';
import { data, Link, useActionData, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { consumeRateLimit } from '@/lib/rate-limit.server';
import { getClientIp } from '@/lib/supabase-admin.server';
import { createSupabaseServerClient } from '@/lib/supabase.server';
import { verifyTurnstile } from '@/lib/turnstile.server';

const TERMS_VERSION = '2026-10-25';

interface LoginResult {
  ok: boolean;
  message: string;
}

export function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);

  return {
    configured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    error: url.searchParams.get('error'),
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const allowed = await consumeRateLimit(request, context, 'login', 10, 3600);

  if (!allowed) {
    return data<LoginResult>(
      {
        ok: false,
        message:
          'Demasiados intentos desde esta conexión. Espera una hora e inténtalo de nuevo.',
      },
      { status: 429 },
    );
  }

  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    return data<LoginResult>(
      {
        ok: false,
        message:
          'Supabase no está configurado. Define SUPABASE_URL y SUPABASE_ANON_KEY en el entorno del Worker.',
      },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const acceptedTerms = formData.get('terms') === 'on';
  const turnstileToken = formData.get('cf-turnstile-response');

  if (!acceptedTerms) {
    return data<LoginResult>(
      {
        ok: false,
        message:
          'Debes aceptar los términos, la política de contenido y la privacidad.',
      },
      { status: 400, headers: supabase.responseHeaders },
    );
  }

  const human = await verifyTurnstile(
    typeof turnstileToken === 'string' ? turnstileToken : null,
    env.TURNSTILE_SECRET_KEY,
    getClientIp(request),
  );

  if (!human) {
    return data<LoginResult>(
      {
        ok: false,
        message: 'Completa la verificación anti-bot e inténtalo de nuevo.',
      },
      { status: 400, headers: supabase.responseHeaders },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return data<LoginResult>(
      { ok: false, message: 'Introduce un email válido.' },
      { status: 400, headers: supabase.responseHeaders },
    );
  }

  const redirectTo = new URL('/auth/confirm', request.url).toString();
  const { error } = await supabase.client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
      data: { terms_version: TERMS_VERSION },
    },
  });

  if (error) {
    return data<LoginResult>(
      { ok: false, message: error.message },
      { status: 400, headers: supabase.responseHeaders },
    );
  }

  return data<LoginResult>(
    {
      ok: true,
      message:
        'Te enviamos un enlace de acceso. Revisa tu correo para entrar en el espacio.',
    },
    { headers: supabase.responseHeaders },
  );
}

export const meta: MetaFunction = () => [
  { title: 'Entrar — work-portfolio' },
  {
    name: 'description',
    content: 'Acceso a la plataforma de portafolios 3D.',
  },
];

export default function LoginRoute() {
  const { configured, turnstileSiteKey, error } =
    useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <>
      <SiteHeader />
      <main className="login-page">
        <section className="login-card">
          <p className="eyebrow">Cuenta</p>
          <h1>Entrar</h1>
          <p>
            Accede con un enlace mágico por email. La sesión se guarda en
            cookies gestionadas por el Worker; no hay contraseñas.
          </p>

          {error ? (
            <div className="login-notice" role="alert">
              {error === 'config'
                ? 'Supabase no está configurado en este entorno.'
                : decodeURIComponent(error)}
            </div>
          ) : null}

          {result ? (
            <div
              className={
                result.ok ? 'login-notice login-notice--ok' : 'login-notice'
              }
              role={result.ok ? 'status' : 'alert'}
            >
              {result.message}
            </div>
          ) : null}

          {configured ? (
            <form method="post" className="login-form">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="tu@email.com"
              />

              {turnstileSiteKey ? (
                <TurnstileWidget siteKey={turnstileSiteKey} />
              ) : null}

              <label className="login-checkbox">
                <input type="checkbox" name="terms" required />
                <span>
                  Acepto los{' '}
                  <Link to="/terms" target="_blank">
                    términos
                  </Link>
                  , la{' '}
                  <Link to="/content-policy" target="_blank">
                    política de contenido
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacy" target="_blank">
                    privacidad
                  </Link>
                  .
                </span>
              </label>

              <button type="submit" className="button button--primary">
                Enviar enlace de acceso
              </button>
            </form>
          ) : (
            <div className="login-notice">
              Supabase todavía no está configurado. Define `SUPABASE_URL` y
              `SUPABASE_ANON_KEY` en `.dev.vars` para desarrollo o en las
              variables del Worker para producción.
            </div>
          )}

          <div className="profile-actions">
            <Link to="/u/demo" className="button button--secondary">
              Ver el perfil de ejemplo
            </Link>
            <Link to="/" className="button button--secondary">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

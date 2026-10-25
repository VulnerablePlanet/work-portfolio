import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from 'react-router';
import { data, redirect, useActionData, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { createSupabaseAdminClient } from '@/lib/supabase-admin.server';
import { createSupabaseServerClient } from '@/lib/supabase.server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    return redirect('/login?error=config');
  }

  const {
    data: { user },
  } = await supabase.client.auth.getUser();

  if (!user) {
    return redirect('/login?next=/settings');
  }

  return { email: user.email ?? 'Sin email' };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    return data({ error: 'Supabase no está configurado.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.client.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();

  if (formData.get('confirm') !== 'on') {
    return data(
      { error: 'Confirma que quieres borrar la cuenta.' },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient(context);

  if (!admin) {
    return data(
      {
        error:
          'El borrado de cuenta requiere SUPABASE_SERVICE_ROLE_KEY en el servidor.',
      },
      { status: 503 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  return redirect('/');
}

export const meta: MetaFunction = () => [
  { title: 'Cuenta — work-portfolio' },
  { name: 'robots', content: 'noindex' },
];

export default function SettingsRoute() {
  const { email } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();

  return (
    <>
      <SiteHeader />
      <main className="login-page">
        <section className="login-card">
          <p className="eyebrow">Cuenta</p>
          <h1>Tu cuenta</h1>
          <p>{email}</p>

          {result?.error ? (
            <div className="login-notice" role="alert">
              {result.error}
            </div>
          ) : null}

          <h2>Borrar cuenta</h2>
          <p>
            Elimina el perfil, los espacios, las habitaciones, las versiones y
            los assets de la base de datos. Los snapshots y assets de R2 se
            limpian con el job de mantenimiento.
          </p>
          <form method="post" className="login-form">
            <label className="login-checkbox">
              <input type="checkbox" name="confirm" required />
              <span>
                Entiendo que esta acción es irreversible y quiero borrar mi
                cuenta.
              </span>
            </label>
            <button type="submit" className="button button--secondary">
              Borrar mi cuenta
            </button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from 'react-router';
import { data, redirect, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import {
  loadOpenReports,
  resolveReport,
} from '@/lib/moderation.server';
import { createSupabaseServerClient } from '@/lib/supabase.server';

async function requireAdmin(request: Request, context: LoaderFunctionArgs['context']) {
  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    throw new Response('No encontrado', { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.client.auth.getUser();

  if (!user) {
    throw new Response('No encontrado', { status: 404 });
  }

  const { data: profile } = await supabase.client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    throw new Response('No encontrado', { status: 404 });
  }
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  return { reports: await loadOpenReports(context) };
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);

  const formData = await request.formData();
  const reportId = String(formData.get('reportId') ?? '');
  const decision = formData.get('decision');

  if (!reportId || (decision !== 'hide' && decision !== 'dismiss')) {
    return data({ error: 'Decisión inválida.' }, { status: 400 });
  }

  await resolveReport(context, reportId, decision);

  return redirect('/admin');
}

export const meta: MetaFunction = () => [
  { title: 'Moderación — work-portfolio' },
  { name: 'robots', content: 'noindex' },
];

export default function AdminRoute() {
  const { reports } = useLoaderData<typeof loader>();

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">Administración</p>
          <h1>Moderación</h1>
          <p className="profile-hero__summary">
            Reportes abiertos. Ocultar suspende la habitación; descartar la
            mantiene publicada.
          </p>
        </section>

        <section className="profile-section">
          {reports.length === 0 ? (
            <div className="profile-room__preview">
              <p className="profile-card__eyebrow">Sin reportes</p>
              <h3>No hay reportes abiertos.</h3>
            </div>
          ) : (
            <div className="report-list">
              {reports.map((report) => (
                <article className="profile-card" key={report.id}>
                  <p className="profile-card__eyebrow">{report.reason}</p>
                  <h3>{report.roomTitle}</h3>
                  <p>{report.details || 'Sin detalles.'}</p>
                  <p className="profile-card__meta">
                    {new Date(report.createdAt).toLocaleString('es-CO')}
                  </p>
                  <form method="post" className="report-actions">
                    <input type="hidden" name="reportId" value={report.id} />
                    <button
                      type="submit"
                      name="decision"
                      value="hide"
                      className="button button--secondary"
                    >
                      Ocultar habitación
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="dismiss"
                      className="button button--secondary"
                    >
                      Descartar reporte
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

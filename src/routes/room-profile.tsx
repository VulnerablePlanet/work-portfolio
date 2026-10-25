import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from 'react-router';
import { data, Link, useActionData, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { getInteractiveNodes } from '@/domain/room/selectors';
import {
  parseReportReason,
  REPORT_REASONS,
} from '@/lib/moderation';
import { submitReport } from '@/lib/moderation.server';
import type { PublicSpace } from '@/lib/public-space';
import { consumeRateLimit } from '@/lib/rate-limit.server';
import { loadPublicRoom } from '@/lib/rooms.server';

const REPORT_LABELS: Record<string, string> = {
  spam: 'Spam o engaño',
  harassment: 'Acoso',
  sexual: 'Contenido sexual',
  violence: 'Violencia',
  copyright: 'Copyright',
  other: 'Otro',
};

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const result = await loadPublicRoom(
    request,
    context,
    params.handle ?? '',
    params.room ?? '',
  );

  if (!result) {
    throw new Response('Habitación no encontrada', { status: 404 });
  }

  return result;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const roomId = String(formData.get('roomId') ?? '');
  const reason = parseReportReason(String(formData.get('reason') ?? ''));
  const details = String(formData.get('details') ?? '');

  if (!roomId || !reason) {
    return data(
      { ok: false, message: 'Selecciona un motivo válido.' },
      { status: 400 },
    );
  }

  const allowed = await consumeRateLimit(request, context, 'report', 5, 3600);

  if (!allowed) {
    return data(
      {
        ok: false,
        message:
          'Has enviado demasiados reportes. Espera una hora e inténtalo de nuevo.',
      },
      { status: 429 },
    );
  }

  try {
    await submitReport(request, context, { roomId, reason, details });
    return data({
      ok: true,
      message: 'Reporte enviado. Gracias por ayudar a moderar la plataforma.',
    });
  } catch {
    return data(
      {
        ok: false,
        message:
          'No se pudo enviar el reporte. Inténtalo de nuevo más tarde.',
      },
      { status: 503 },
    );
  }
}

export const meta: MetaFunction = ({ data }) => {
  const result = data as
    | { space?: PublicSpace; room?: PublicSpace['rooms'][number] }
    | undefined;

  return [
    {
      title: result?.room
        ? `${result.room.title} — ${result.space?.displayName ?? 'work-portfolio'}`
        : 'Habitación 3D — work-portfolio',
    },
    {
      name: 'description',
      content:
        result?.room?.document.meta.summary ??
        'Habitación 3D de un portafolio.',
    },
  ];
};

export default function RoomProfileRoute() {
  const { space, room } = useLoaderData<typeof loader>();
  const reportResult = useActionData<typeof action>();
  const nodes = getInteractiveNodes(room.document);
  const experiencePath = `/u/${space.handle}/${room.slug}/room`;

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">{space.displayName}</p>
          <h1>{room.title}</h1>
          <p className="profile-hero__headline">{space.headline}</p>
          <p className="profile-hero__summary">{room.document.meta.summary}</p>
          <div className="profile-actions">
            <Link to={experiencePath} className="button button--primary">
              Entrar a la habitación
            </Link>
            <Link to={`/u/${space.handle}`} className="button button--secondary">
              Volver al perfil
            </Link>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="contenido">
          <div className="profile-section__header">
            <h2 id="contenido">Contenido de la habitación</h2>
            <span className="profile-section__hint">
              {nodes.length} objetos interactivos
            </span>
          </div>
          <div className="profile-grid">
            {nodes.map((node) => {
              const content = node.interaction;

              if (!content) {
                return null;
              }

              return (
                <article className="profile-card" key={node.id}>
                  <p className="profile-card__eyebrow">{content.eyebrow}</p>
                  <h3>{content.title}</h3>
                  <p>{content.body}</p>
                  {content.links && content.links.length > 0 ? (
                    <ul className="profile-card__links">
                      {content.links.map((link) => (
                        <li key={`${link.label}:${link.href}`}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {room.id !== 'demo-estudio' ? (
          <section className="profile-section" aria-labelledby="reportar">
            <details className="report-panel">
              <summary>Reportar esta habitación</summary>
              {reportResult ? (
                <p
                  className={
                    reportResult.ok
                      ? 'login-notice login-notice--ok'
                      : 'login-notice'
                  }
                  role={reportResult.ok ? 'status' : 'alert'}
                >
                  {reportResult.message}
                </p>
              ) : null}
              <form method="post" className="report-form">
                <input type="hidden" name="roomId" value={room.id} />
                <label htmlFor="report-reason">Motivo</label>
                <select id="report-reason" name="reason" required>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {REPORT_LABELS[reason] ?? reason}
                    </option>
                  ))}
                </select>
                <label htmlFor="report-details">Detalles (opcional)</label>
                <textarea
                  id="report-details"
                  name="details"
                  rows={3}
                  maxLength={500}
                  placeholder="Cuéntanos qué ocurre"
                />
                <button type="submit" className="button button--secondary">
                  Enviar reporte
                </button>
              </form>
            </details>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { getInteractiveNodes } from '@/domain/room/selectors';
import type { PublicSpace } from '@/lib/public-space';
import { loadPublicRoom } from '@/lib/rooms.server';

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
      </main>
      <SiteFooter />
    </>
  );
}

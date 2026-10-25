import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import {
  DEMO_HANDLE,
  DEMO_ROOM_SLUG,
  DEMO_SPACE,
} from '@/content/seed/demo-space';
import { getInteractiveNodes } from '@/domain/room/selectors';

export function loader({ params }: LoaderFunctionArgs) {
  if (params.handle !== DEMO_HANDLE || params.room !== DEMO_ROOM_SLUG) {
    throw new Response('Habitación no encontrada', { status: 404 });
  }

  return { space: DEMO_SPACE };
}

export const meta: MetaFunction = () => [
  { title: `${DEMO_SPACE.room.title} — ${DEMO_SPACE.displayName}` },
  { name: 'description', content: DEMO_SPACE.room.document.meta.summary },
];

export default function RoomProfileRoute() {
  const { space } = useLoaderData<typeof loader>();
  const nodes = getInteractiveNodes(space.room.document);
  const experiencePath = `/u/${space.handle}/${space.room.slug}/room`;

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">{space.displayName}</p>
          <h1>{space.room.title}</h1>
          <p className="profile-hero__headline">{space.headline}</p>
          <p className="profile-hero__summary">
            {space.room.document.meta.summary}
          </p>
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

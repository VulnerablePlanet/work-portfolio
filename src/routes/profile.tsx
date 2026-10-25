import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { DEMO_HANDLE, DEMO_SPACE } from '@/content/seed/demo-space';
import { getInteractiveNodes } from '@/domain/room/selectors';

export function loader({ params }: LoaderFunctionArgs) {
  if (params.handle !== DEMO_HANDLE) {
    throw new Response('Perfil no encontrado', { status: 404 });
  }

  return { space: DEMO_SPACE };
}

export const meta: MetaFunction = () => [
  { title: `${DEMO_SPACE.displayName} — ${DEMO_SPACE.title}` },
  { name: 'description', content: DEMO_SPACE.summary },
];

export default function ProfileRoute() {
  const { space } = useLoaderData<typeof loader>();
  const nodes = getInteractiveNodes(space.room.document);
  const experiencePath = `/u/${space.handle}/${space.room.slug}/room`;

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">Portafolio 3D</p>
          <h1>{space.displayName}</h1>
          <p className="profile-hero__headline">{space.headline}</p>
          <p className="profile-hero__summary">{space.summary}</p>
          <div className="profile-actions">
            <Link to={experiencePath} className="button button--primary">
              Entrar a la habitación
            </Link>
            <Link
              to={`/u/${space.handle}/${space.room.slug}`}
              className="button button--secondary"
            >
              Ver esta habitación
            </Link>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="habitacion">
          <div className="profile-section__header">
            <h2 id="habitacion">Habitación</h2>
            <span className="profile-section__hint">1 espacio</span>
          </div>
          <div className="profile-room">
            <div className="profile-room__preview">
              <p className="profile-card__eyebrow">Escena 3D</p>
              <h3>{space.room.title}</h3>
              <p>{space.room.document.meta.summary}</p>
              <div className="profile-actions">
                <Link to={experiencePath} className="button button--primary">
                  Abrir en 3D
                </Link>
              </div>
            </div>
            <div className="profile-room__meta">
              <div>
                <span>Render</span>
                <strong>WebGPU / WebGL2</strong>
              </div>
              <div>
                <span>Contenido</span>
                <strong>{nodes.length} objetos interactivos</strong>
              </div>
              <div>
                <span>Accesible</span>
                <strong>Esta misma página, sin 3D</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="contenido">
          <div className="profile-section__header">
            <h2 id="contenido">Contenido</h2>
            <span className="profile-section__hint">
              Proyectos, skills y arquitectura
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

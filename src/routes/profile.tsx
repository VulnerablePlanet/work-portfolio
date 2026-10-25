import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { getInteractiveNodes } from '@/domain/room/selectors';
import type { PublicSpace } from '@/lib/public-space';
import { loadPublicSpace } from '@/lib/rooms.server';

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const space = await loadPublicSpace(request, context, params.handle ?? '');

  if (!space) {
    throw new Response('Perfil no encontrado', { status: 404 });
  }

  return { space };
}

export const meta: MetaFunction = ({ data }) => {
  const space = (data as { space?: PublicSpace } | undefined)?.space;

  return [
    {
      title: space
        ? `${space.displayName} — ${space.title}`
        : 'Perfil 3D — work-portfolio',
    },
    {
      name: 'description',
      content: space?.summary ?? 'Perfil de un espacio de trabajo 3D.',
    },
  ];
};

export default function ProfileRoute() {
  const { space } = useLoaderData<typeof loader>();
  const nodes = space.rooms.flatMap((room) =>
    getInteractiveNodes(room.document),
  );
  const firstRoom = space.rooms[0];
  const experiencePath = firstRoom
    ? `/u/${space.handle}/${firstRoom.slug}/room`
    : null;

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
            {experiencePath ? (
              <Link to={experiencePath} className="button button--primary">
                Entrar a la habitación
              </Link>
            ) : null}
            {firstRoom ? (
              <Link
                to={`/u/${space.handle}/${firstRoom.slug}`}
                className="button button--secondary"
              >
                Ver esta habitación
              </Link>
            ) : null}
          </div>
        </section>

        <section className="profile-section" aria-labelledby="habitaciones">
          <div className="profile-section__header">
            <h2 id="habitaciones">Habitaciones</h2>
            <span className="profile-section__hint">
              {space.rooms.length} publicadas
            </span>
          </div>
          {space.rooms.length === 0 ? (
            <div className="profile-room__preview">
              <p className="profile-card__eyebrow">Sin publicaciones</p>
              <h3>Este espacio todavía no tiene habitaciones publicadas.</h3>
              <p>
                Cuando el autor publique una habitación, aparecerá aquí con su
                contenido y su enlace a la experiencia 3D.
              </p>
            </div>
          ) : (
            <div className="profile-grid">
              {space.rooms.map((room) => (
                <article className="profile-card" key={room.slug}>
                  <p className="profile-card__eyebrow">{room.purpose}</p>
                  <h3>{room.title}</h3>
                  <p>{room.document.meta.summary}</p>
                  <ul className="profile-card__links">
                    <li>
                      <Link to={`/u/${space.handle}/${room.slug}`}>
                        Ver habitación
                      </Link>
                    </li>
                    <li>
                      <Link to={`/u/${space.handle}/${room.slug}/room`}>
                        Abrir en 3D
                      </Link>
                    </li>
                  </ul>
                </article>
              ))}
            </div>
          )}
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

import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { DEMO_HANDLE, DEMO_ROOM_SLUG } from '@/content/seed/demo-space';

export const meta: MetaFunction = () => [
  { title: 'work-portfolio — Portafolios 3D que se pueden recorrer' },
  {
    name: 'description',
    content:
      'Plataforma open source para crear espacios de trabajo 3D y contar un portafolio con habitaciones navegables.',
  },
];

export default function HomeRoute() {
  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">Portafolio interactivo 3D</p>
          <h1>Tu trabajo, en un espacio que se puede recorrer.</h1>
          <p className="profile-hero__headline">
            Habitaciones 3D, contenido real y una versión web accesible.
          </p>
          <p className="profile-hero__summary">
            work-portfolio convierte un portafolio en un lugar: una habitación
            con proyectos, skills y una consola de arquitectura. El perfil
            público es HTML indexable; la experiencia 3D es la mejora
            progresiva.
          </p>
          <div className="profile-actions">
            <Link to={`/u/${DEMO_HANDLE}`} className="button button--primary">
              Ver espacio de ejemplo
            </Link>
            <Link
              to={`/u/${DEMO_HANDLE}/${DEMO_ROOM_SLUG}/room`}
              className="button button--secondary"
            >
              Entrar a la habitación
            </Link>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="que-es">
          <div className="profile-section__header">
            <h2 id="que-es">Qué hay dentro</h2>
            <span className="profile-section__hint">M0 · fundaciones</span>
          </div>
          <div className="profile-grid">
            <article className="profile-card">
              <p className="profile-card__eyebrow">Habitación</p>
              <h3>Un documento, no JSX</h3>
              <p>
                La sala, sus objetos, luces y colisiones se derivan de un
                RoomDocument validado. El editor podrá modificarlo sin tocar
                código.
              </p>
            </article>
            <article className="profile-card">
              <p className="profile-card__eyebrow">Contenido</p>
              <h3>3D y HTML desde la misma fuente</h3>
              <p>
                Cada objeto interactivo lleva su contenido. El panel 3D y el
                perfil público muestran el mismo texto, sin duplicación.
              </p>
            </article>
            <article className="profile-card">
              <p className="profile-card__eyebrow">Open source</p>
              <h3>Sin dependencia de un backend propietario</h3>
              <p>
                React Router, Three.js, Rapier y Zustand. La base de datos y el
                almacenamiento llegan en M1 con Supabase y R2.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

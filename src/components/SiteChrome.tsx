import { Link } from 'react-router';
import { DEMO_HANDLE, DEMO_ROOM_SLUG } from '@/content/seed/demo-space';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-brand">
          <span className="site-brand__mark" aria-hidden="true" />
          work-portfolio
        </Link>
        <nav className="site-nav" aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link to={`/u/${DEMO_HANDLE}`}>Perfil</Link>
          <Link to={`/u/${DEMO_HANDLE}/${DEMO_ROOM_SLUG}`}>Habitación</Link>
          <Link to="/login">Entrar</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="profile-footer">
      <p>
        Proyecto open source con licencia MIT. Construido con React Router,
        React Three Fiber, Three.js y Rapier.
      </p>
    </footer>
  );
}

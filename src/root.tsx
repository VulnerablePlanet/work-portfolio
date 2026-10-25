import { useEffect, type ReactNode } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from 'react-router';
import { registerServiceWorker } from '@/app/pwa/register-service-worker';
import '@/styles/base.css';
import '@/styles/profile.css';

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isExperience = location.pathname.endsWith('/room');

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#050816" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body className={isExperience ? 'experience-body' : 'site-body'}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="error-page">
      <p className="eyebrow">{isNotFound ? '404' : 'Error'}</p>
      <h1>{isNotFound ? 'Página no encontrada' : 'Algo salió mal'}</h1>
      <p>
        {isNotFound
          ? 'La habitación o el perfil que buscas no existe.'
          : 'No se pudo cargar esta página. Vuelve al inicio e inténtalo de nuevo.'}
      </p>
      <a className="button button--primary" href="/">
        Volver al inicio
      </a>
    </main>
  );
}

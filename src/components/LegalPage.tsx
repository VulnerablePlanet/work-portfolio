import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <section className="profile-hero">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="profile-hero__summary">
            Última actualización: 25 de octubre de 2026. Este texto es un
            borrador operativo y debe revisarse con asesoría legal antes de
            abrir el registro a producción.
          </p>
        </section>
        <section className="profile-section">
          <article className="profile-card legal-content">{children}</article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

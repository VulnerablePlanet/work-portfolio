import type { MetaFunction } from 'react-router';
import { LegalPage } from '@/components/LegalPage';

export const meta: MetaFunction = () => [
  { title: 'Privacidad — work-portfolio' },
  { name: 'description', content: 'Política de privacidad de work-portfolio.' },
];

export default function PrivacyRoute() {
  return (
    <LegalPage eyebrow="Legal" title="Privacidad">
      <h2>Datos que tratamos</h2>
      <ul>
        <li>Email de la cuenta, handle, nombre visible, headline y avatar.</li>
        <li>Contenido que publicas: habitaciones, textos, enlaces e imágenes.</li>
        <li>Datos técnicos mínimos para operar y proteger el servicio.</li>
      </ul>
      <h2>Para qué</h2>
      <p>
        Autenticarte, publicar tu perfil, moderar contenido, prevenir abuso y
        mantener la disponibilidad. No usamos analítica de terceros ni vendemos
        datos.
      </p>
      <h2>Dónde se alojan</h2>
      <p>
        Autenticación y base de datos en Supabase; assets y snapshots en
        Cloudflare R2; el shell se sirve desde Cloudflare Workers. Los
        proveedores pueden tratar datos en otras regiones.
      </p>
      <h2>Cookies</h2>
      <p>
        Usamos cookies de sesión de Supabase Auth, necesarias para mantener tu
        cuenta. No usamos cookies publicitarias.
      </p>
      <h2>Retención y derechos</h2>
      <p>
        Conservamos la cuenta mientras exista. Puedes solicitar acceso,
        corrección, exportación o borrado desde la configuración de la cuenta o
        por el contacto de abuso. El borrado elimina perfil, espacios,
        habitaciones, versiones y assets asociados.
      </p>
      <h2>Contacto</h2>
      <p>
        Para ejercer tus derechos o reportar un problema de privacidad, usa el
        contacto indicado en la política de contenido.
      </p>
    </LegalPage>
  );
}

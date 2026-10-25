import type { MetaFunction } from 'react-router';
import { LegalPage } from '@/components/LegalPage';

export const meta: MetaFunction = () => [
  { title: 'Términos — work-portfolio' },
  { name: 'description', content: 'Términos de uso de work-portfolio.' },
];

export default function TermsRoute() {
  return (
    <LegalPage eyebrow="Legal" title="Términos de uso">
      <h2>Qué es el servicio</h2>
      <p>
        work-portfolio permite crear espacios y habitaciones 3D para presentar
        un portafolio. El perfil público es HTML accesible; la experiencia 3D es
        una mejora progresiva.
      </p>
      <h2>Cuenta</h2>
      <p>
        Para publicar necesitas una cuenta con email verificado. Eres
        responsable de la actividad de tu cuenta y de mantener el acceso a tu
        correo.
      </p>
      <h2>Contenido</h2>
      <p>
        Conservas la titularidad de los textos, imágenes y modelos que subes.
        Nos concedes una licencia limitada para alojarlos, procesarlos y
        mostrarlos con el fin de operar el servicio. Debes tener derechos sobre
        lo que publicas.
      </p>
      <h2>Publicación y moderación</h2>
      <p>
        Puedes publicar habitaciones dentro de las cuotas. Podemos ocultar o
        suspender contenido que incumpla la política de contenido o reciba
        reportes, y podemos restaurarlo tras revisión.
      </p>
      <h2>Disponibilidad y responsabilidad</h2>
      <p>
        El servicio se ofrece tal cual, sin garantía de disponibilidad continua.
        En la medida permitida por la ley, no respondemos por daños indirectos
        derivados del uso del servicio.
      </p>
      <h2>Cambios y contacto</h2>
      <p>
        Podemos actualizar estos términos; la fecha de la parte superior indica
        la versión vigente. Para consultas, usa el contacto de abuso indicado en
        la política de contenido.
      </p>
    </LegalPage>
  );
}

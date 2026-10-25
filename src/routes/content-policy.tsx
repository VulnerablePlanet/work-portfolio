import type { MetaFunction } from 'react-router';
import { LegalPage } from '@/components/LegalPage';

export const meta: MetaFunction = () => [
  { title: 'Política de contenido — work-portfolio' },
  {
    name: 'description',
    content: 'Reglas de contenido y moderación de work-portfolio.',
  },
];

export default function ContentPolicyRoute() {
  return (
    <LegalPage eyebrow="Legal" title="Política de contenido">
      <h2>Qué no se permite</h2>
      <ul>
        <li>Spam, engaño, suplantación de identidad o enlaces maliciosos.</li>
        <li>Acoso, amenazas, discurso de odio o contenido sexual no consentido.</li>
        <li>Violencia gráfica, contenido ilegal o explotación de menores.</li>
        <li>Material con copyright sin autorización.</li>
        <li>Modelos 3D o imágenes que no puedas distribuir.</li>
      </ul>
      <h2>Reportes</h2>
      <p>
        Cualquier visitante puede reportar una habitación desde su perfil. Tres
        reportes abiertos ocultan automáticamente la habitación mientras se
        revisa. El autor puede apelar por el contacto de abuso.
      </p>
      <h2>Moderación</h2>
      <p>
        Podemos ocultar, suspender o eliminar contenido que incumpla estas
        reglas. Las decisiones quedan registradas para auditoría. La reiteración
        puede suponer el cierre de la cuenta.
      </p>
      <h2>Copyright</h2>
      <p>
        Si eres titular de derechos y crees que un contenido los infringe,
        escribe al contacto de abuso con la URL, la obra afectada y una
        declaración de buena fe. Actuaremos con retirada y posibilidad de
        contra-notificación.
      </p>
      <h2>Contacto de abuso</h2>
      <p>
        Sustituye este texto por un correo operativo antes de producción:
        <strong> abuse@example.com</strong>.
      </p>
    </LegalPage>
  );
}

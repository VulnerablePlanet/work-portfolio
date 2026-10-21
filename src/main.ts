import '@/styles/base.css';
import {
  buildFallbackUrl,
  detectGraphicsCapabilities,
  readBootstrapDirectives,
} from '@/app/bootstrap/capability-gate';
import { registerServiceWorker } from '@/app/pwa/register-service-worker';
import {
  renderBootStatus,
  updateBootStatus,
} from '@/app/bootstrap/render-boot-status';

async function bootstrap() {
  registerServiceWorker();
  renderBootStatus();
  updateBootStatus({
    phase: 'detecting',
    message: 'Verificando capacidades gráficas del dispositivo…',
  });

  try {
    const directives = readBootstrapDirectives(window.location.search);
    const capabilities = detectGraphicsCapabilities(directives);

    if (directives.forceFallback || capabilities.renderMode === 'fallback') {
      window.location.replace(
        buildFallbackUrl(
          directives.forceFallback
            ? 'Fallback forzado por parámetro.'
            : capabilities.fallbackReason ?? 'Gráficos avanzados no soportados.',
        ),
      );
      return;
    }

    updateBootStatus({
      phase: 'loading-shell',
      message: 'Cargando shell 3D mínima…',
    });

    const { start3DApp } = await import('@/app/bootstrap/start-3d-app');

    if (directives.forceBootFailure) {
      throw new Error('Fallo de bootstrap forzado para pruebas.');
    }

    updateBootStatus({
      phase: 'mounting-3d',
      message: `Inicializando renderer ${capabilities.preferredBackend.toUpperCase()}…`,
    });

    await start3DApp(capabilities);
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : 'Fallo desconocido durante el bootstrap.';

    updateBootStatus({
      phase: 'failed',
      message: 'No se pudo iniciar la experiencia 3D.',
      detail: reason,
      allowFallback: true,
    });
  }
}

void bootstrap();

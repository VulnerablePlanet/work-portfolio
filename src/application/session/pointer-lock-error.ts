export const FALLBACK_LOOK_MESSAGE =
  'Modo compatible activado: mueve el mouse dentro de la ventana para mirar. Para control infinito real, usa Chrome o Edge.';

export function formatPointerLockError(error: unknown): string {
  const detail =
    error instanceof Error && error.message
      ? error.message
      : 'El navegador rechazó la captura del mouse.';

  return `${detail} ${FALLBACK_LOOK_MESSAGE}`;
}

import type { BootstrapPhase } from '@/types/capabilities';

interface BootStatusPayload {
  phase: BootstrapPhase;
  message: string;
  detail?: string;
  allowFallback?: boolean;
}

const BOOT_NODE_ID = 'boot-status';

function getBootNode() {
  return document.getElementById(BOOT_NODE_ID);
}

export function renderBootStatus() {
  if (getBootNode()) {
    return;
  }

  const node = document.createElement('div');
  node.id = BOOT_NODE_ID;
  node.className = 'boot-status';
  node.innerHTML = `
    <div class="boot-status__panel" role="status" aria-live="polite">
      <p class="boot-status__eyebrow">Bootstrap 3D</p>
      <h1 class="boot-status__title">Inicializando experiencia</h1>
      <p class="boot-status__message">Preparando shell…</p>
      <p class="boot-status__detail" hidden></p>
      <div class="boot-status__actions" hidden>
        <a class="boot-status__link" href="/fallback.html">Abrir fallback</a>
      </div>
    </div>
  `;

  document.body.appendChild(node);
}

export function updateBootStatus(payload: BootStatusPayload) {
  const node = getBootNode();

  if (!node) {
    return;
  }

  const title = node.querySelector<HTMLElement>('.boot-status__title');
  const message = node.querySelector<HTMLElement>('.boot-status__message');
  const detail = node.querySelector<HTMLElement>('.boot-status__detail');
  const actions = node.querySelector<HTMLElement>('.boot-status__actions');

  if (title) {
    title.textContent =
      payload.phase === 'failed'
        ? 'Error de arranque'
        : payload.phase === 'ready'
          ? 'Experiencia lista'
          : 'Inicializando experiencia';
  }

  if (message) {
    message.textContent = payload.message;
  }

  if (detail) {
    detail.hidden = !payload.detail;
    detail.textContent = payload.detail ?? '';
  }

  if (actions) {
    actions.hidden = !payload.allowFallback;
  }

  if (payload.phase === 'ready') {
    node.setAttribute('data-phase', 'ready');
    window.setTimeout(() => {
      node.remove();
    }, 250);
  } else {
    node.setAttribute('data-phase', payload.phase);
  }
}

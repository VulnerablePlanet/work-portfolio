import { resolveQualityProfile } from '@/app/bootstrap/quality-tier';
import { PERFORMANCE_BUDGETS } from '@/engine/constants/performance';
import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';

export function DebugHud() {
  const capabilities = useAppStore((state) => state.capabilities);
  const rendererBackend = useAppStore((state) => state.rendererBackend);
  const bootstrapPhase = useAppStore((state) => state.bootstrapPhase);
  const bootError = useAppStore((state) => state.bootError);
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const showDebugHud = useAppStore((state) => state.showDebugHud);
  const showPerf = useAppStore((state) => state.showPerf);
  const showStats = useAppStore((state) => state.showStats);
  const togglePerf = useAppStore((state) => state.togglePerf);
  const toggleStats = useAppStore((state) => state.toggleStats);
  const interactionMode = useInteractionStore((state) => state.mode);

  if (!capabilities || !showDebugHud) {
    return null;
  }

  const currentBudget =
    capabilities.isTouchPrimary || capabilities.qualityTier === 'low'
      ? PERFORMANCE_BUDGETS.mobile
      : PERFORMANCE_BUDGETS.desktop;
  const qualityProfile = resolveQualityProfile(capabilities);
  const profilingAllowed = rendererBackend === 'webgpu';

  return (
    <aside className="debug-hud">
      <p className="debug-hud__eyebrow">Bootstrap 3D</p>
      <h1 className="debug-hud__title">Portfolio room — fase 6 scaffold</h1>

      <dl className="debug-hud__list">
        <div>
          <dt>Backend</dt>
          <dd>{rendererBackend}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{capabilities.qualityTier}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>{currentBudget.frameBudgetMs}ms/frame</dd>
        </div>
        <div>
          <dt>Boot</dt>
          <dd>{bootstrapPhase}</dd>
        </div>
        <div>
          <dt>Touch</dt>
          <dd>{capabilities.isTouchPrimary ? 'sí' : 'no'}</dd>
        </div>
        <div>
          <dt>DPR</dt>
          <dd>
            {qualityProfile.dprRange[0]}–{qualityProfile.dprRange[1]}
          </dd>
        </div>
        <div>
          <dt>Look</dt>
          <dd>{pointerLockActive ? 'locked' : gamePaused ? 'paused' : 'click to lock'}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{interactionMode}</dd>
        </div>
      </dl>

      {bootError ? <p className="debug-hud__error">{bootError}</p> : null}

      {!profilingAllowed ? (
        <p className="debug-hud__hint">
          Perf y Stats se desactivan automáticamente en WebGL2 para evitar ruido
          de profiling durante la validación del fallback real.
        </p>
      ) : null}

      <p className="debug-hud__hint">
        WASD para moverte. Usa “Entrar al modo habitación” para capturar el
        mouse. Si el navegador bloquea pointer lock, mantén click dentro de la
        escena y arrastra para mirar. Apunta a un objeto y presiona E para leer.
      </p>

      <div className="debug-hud__actions">
        <button
          type="button"
          onClick={togglePerf}
          disabled={!profilingAllowed}
          aria-disabled={!profilingAllowed}
        >
          Perf: {profilingAllowed && showPerf ? 'on' : 'off'}
        </button>
        <button
          type="button"
          onClick={toggleStats}
          disabled={!profilingAllowed}
          aria-disabled={!profilingAllowed}
        >
          Stats: {profilingAllowed && showStats ? 'on' : 'off'}
        </button>
        <a href="/fallback.html">Ver fallback</a>
      </div>
    </aside>
  );
}

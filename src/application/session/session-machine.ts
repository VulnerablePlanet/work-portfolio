export type SessionScreen =
  | 'boot'
  | 'menu'
  | 'exploring'
  | 'reading'
  | 'paused';

export type LookMode = 'free' | 'pointer' | 'fallback';

export interface SessionState {
  screen: SessionScreen;
  look: LookMode;
  error: string | null;
}

export type SessionEvent =
  | { type: 'BOOT_READY' }
  | { type: 'BOOT_FAILED'; message: string }
  | { type: 'ENTER' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'INTERACT' }
  | { type: 'CLOSE_READING' }
  | { type: 'EXIT' }
  | { type: 'POINTER_LOCK_ACQUIRED' }
  | { type: 'POINTER_LOCK_LOST' }
  | { type: 'FALLBACK_LOOK'; message: string }
  | { type: 'WINDOW_BLUR' }
  | { type: 'CLEAR_ERROR' };

export type SessionEffect =
  | { type: 'request-pointer-lock' }
  | { type: 'release-pointer-lock' };

export interface SessionTransition {
  state: SessionState;
  effects: SessionEffect[];
}

export const initialSessionState: SessionState = {
  screen: 'boot',
  look: 'free',
  error: null,
};

const REQUEST_LOCK: SessionEffect[] = [{ type: 'request-pointer-lock' }];
const RELEASE_LOCK: SessionEffect[] = [{ type: 'release-pointer-lock' }];

function transition(
  state: SessionState,
  patch: Partial<SessionState>,
  effects: SessionEffect[] = [],
): SessionTransition {
  return {
    state: { ...state, ...patch },
    effects,
  };
}

function unchanged(state: SessionState): SessionTransition {
  return { state, effects: [] };
}

/**
 * Máquina de sesión pura. No conoce DOM, pointer lock ni React.
 *
 * Invariantes:
 * - `reading` y `paused` implican cursor libre.
 * - La lectura se cierra hacia `exploring`, nunca hacia el menú.
 * - Un pointer lock perdido solo pausa si se estaba explorando.
 */
export function reduceSession(
  state: SessionState,
  event: SessionEvent,
): SessionTransition {
  switch (event.type) {
    case 'BOOT_READY':
      return state.screen === 'boot'
        ? transition(state, { screen: 'menu' })
        : unchanged(state);

    case 'BOOT_FAILED':
      return transition(state, { screen: 'boot', error: event.message });

    case 'ENTER':
      if (state.screen !== 'menu') {
        return unchanged(state);
      }

      return transition(
        state,
        { screen: 'exploring', look: 'free', error: null },
        REQUEST_LOCK,
      );

    case 'RESUME':
      if (state.screen !== 'paused') {
        return unchanged(state);
      }

      return transition(
        state,
        { screen: 'exploring', look: 'free', error: null },
        REQUEST_LOCK,
      );

    case 'INTERACT':
      if (state.screen !== 'exploring') {
        return unchanged(state);
      }

      return transition(state, { screen: 'reading', look: 'free' }, RELEASE_LOCK);

    case 'CLOSE_READING':
      if (state.screen !== 'reading') {
        return unchanged(state);
      }

      return transition(
        state,
        { screen: 'exploring', look: 'free', error: null },
        REQUEST_LOCK,
      );

    case 'PAUSE':
      if (state.screen !== 'exploring') {
        return unchanged(state);
      }

      return transition(state, { screen: 'paused', look: 'free' }, RELEASE_LOCK);

    case 'EXIT':
      if (state.screen === 'menu') {
        return unchanged(state);
      }

      return transition(state, { screen: 'menu', look: 'free' }, RELEASE_LOCK);

    case 'POINTER_LOCK_ACQUIRED':
      if (state.screen === 'boot' || state.screen === 'reading') {
        return unchanged(state);
      }

      return transition(state, {
        screen: 'exploring',
        look: 'pointer',
        error: null,
      });

    case 'POINTER_LOCK_LOST':
      if (state.screen !== 'exploring') {
        return unchanged(state);
      }

      return transition(state, { screen: 'paused', look: 'free' });

    case 'FALLBACK_LOOK':
      if (state.screen !== 'exploring') {
        return unchanged(state);
      }

      return transition(state, { look: 'fallback', error: event.message });

    case 'WINDOW_BLUR':
      if (state.screen !== 'exploring') {
        return unchanged(state);
      }

      return transition(state, { screen: 'paused', look: 'free' }, RELEASE_LOCK);

    case 'CLEAR_ERROR':
      return state.error === null
        ? unchanged(state)
        : transition(state, { error: null });
  }
}

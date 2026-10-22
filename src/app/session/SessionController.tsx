import { useEffect } from 'react';
import {
  registerSessionEffectHandler,
  useSessionStore,
} from '@/store/useSessionStore';
import {
  FALLBACK_LOOK_MESSAGE,
  formatPointerLockError,
} from '@/application/session/pointer-lock-error';
import {
  releaseGamePointerLock,
  requestGamePointerLock,
} from '@/player/pointer-lock-events';
import { useInteractionStore } from '@/store/useInteractionStore';

/**
 * Único dueño de ESC, del pointer lock y de los efectos de la máquina de
 * sesión. No renderiza nada.
 */
export function SessionController() {
  const dispatch = useSessionStore((state) => state.dispatch);

  useEffect(() => {
    dispatch({ type: 'BOOT_READY' });
  }, [dispatch]);

  useEffect(() => {
    registerSessionEffectHandler((effect) => {
      if (effect.type === 'release-pointer-lock') {
        releaseGamePointerLock();
        return;
      }

      void requestGamePointerLock().catch((error: unknown) => {
        dispatch({
          type: 'FALLBACK_LOOK',
          message: formatPointerLockError(error),
        });
      });
    });

    return () => {
      registerSessionEffectHandler(null);
    };
  }, [dispatch]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement !== null;
      dispatch(
        locked
          ? { type: 'POINTER_LOCK_ACQUIRED' }
          : { type: 'POINTER_LOCK_LOST' },
      );
    };

    const handlePointerLockError = () => {
      dispatch({
        type: 'FALLBACK_LOOK',
        message: `El navegador rechazó la captura del mouse. ${FALLBACK_LOOK_MESSAGE}`,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' || event.repeat) {
        return;
      }

      const session = useSessionStore.getState();

      if (session.screen === 'reading') {
        useInteractionStore.getState().finishCloseActiveObject();
        dispatch({ type: 'CLOSE_READING' });
        return;
      }

      if (session.screen === 'exploring') {
        dispatch({ type: 'PAUSE' });
        return;
      }

      if (session.screen === 'paused') {
        dispatch({ type: 'EXIT' });
      }
    };

    const handleBlur = () => {
      dispatch({ type: 'WINDOW_BLUR' });
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [dispatch]);

  return null;
}

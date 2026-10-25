import { create } from 'zustand';
import {
  initialSessionState,
  reduceSession,
  type SessionEffect,
  type SessionEvent,
  type SessionState,
} from '@/application/session/session-machine';

type EffectHandler = (effect: SessionEffect) => void;

let effectHandler: EffectHandler | null = null;

export function registerSessionEffectHandler(
  handler: EffectHandler | null,
): void {
  effectHandler = handler;
}

interface SessionStore extends SessionState {
  dispatch: (event: SessionEvent) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initialSessionState,
  dispatch: (event) => {
    const transition = reduceSession(get(), event);

    set(transition.state);

    if (effectHandler) {
      for (const effect of transition.effects) {
        effectHandler(effect);
      }
    }
  },
}));

export function resetSession(): void {
  useSessionStore.setState(initialSessionState);
}

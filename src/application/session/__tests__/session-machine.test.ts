import { describe, expect, it } from 'vitest';
import {
  initialSessionState,
  reduceSession,
  type SessionEvent,
  type SessionState,
} from '@/application/session/session-machine';

function run(state: SessionState, event: SessionEvent) {
  return reduceSession(state, event);
}

const menu: SessionState = { screen: 'menu', look: 'free', error: null };
const exploring: SessionState = {
  screen: 'exploring',
  look: 'pointer',
  error: null,
};
const reading: SessionState = { screen: 'reading', look: 'free', error: null };
const paused: SessionState = { screen: 'paused', look: 'free', error: null };

describe('máquina de sesión', () => {
  it('arranca en boot y pasa a menu al estar listo', () => {
    expect(initialSessionState.screen).toBe('boot');
    expect(run(initialSessionState, { type: 'BOOT_READY' }).state.screen).toBe(
      'menu',
    );
  });

  it('entra a explorar y pide pointer lock', () => {
    const transition = run(menu, { type: 'ENTER' });

    expect(transition.state.screen).toBe('exploring');
    expect(transition.effects).toEqual([{ type: 'request-pointer-lock' }]);
  });

  it('confirma el pointer lock y limpia el error', () => {
    const transition = run(
      { ...exploring, look: 'free', error: 'anterior' },
      { type: 'POINTER_LOCK_ACQUIRED' },
    );

    expect(transition.state.look).toBe('pointer');
    expect(transition.state.error).toBeNull();
  });

  it('pausa cuando se pierde el pointer lock explorando', () => {
    const transition = run(exploring, { type: 'POINTER_LOCK_LOST' });

    expect(transition.state).toMatchObject({
      screen: 'paused',
      look: 'free',
    });
  });

  it('ignora la pérdida de pointer lock durante la lectura', () => {
    const transition = run(reading, { type: 'POINTER_LOCK_LOST' });

    expect(transition.state).toBe(reading);
  });

  it('abre la lectura y libera el pointer lock', () => {
    const transition = run(exploring, { type: 'INTERACT' });

    expect(transition.state.screen).toBe('reading');
    expect(transition.state.look).toBe('free');
    expect(transition.effects).toEqual([{ type: 'release-pointer-lock' }]);
  });

  it('cierra la lectura hacia explorar, no hacia el menú', () => {
    const transition = run(reading, { type: 'CLOSE_READING' });

    expect(transition.state.screen).toBe('exploring');
    expect(transition.effects).toEqual([{ type: 'request-pointer-lock' }]);
  });

  it('reanuda desde pausa', () => {
    const transition = run(paused, { type: 'RESUME' });

    expect(transition.state.screen).toBe('exploring');
    expect(transition.effects).toEqual([{ type: 'request-pointer-lock' }]);
  });

  it('pausa desde explorar y libera el lock', () => {
    const transition = run(exploring, { type: 'PAUSE' });

    expect(transition.state.screen).toBe('paused');
    expect(transition.effects).toEqual([{ type: 'release-pointer-lock' }]);
  });

  it('sale al menú desde pausa y desde explorar', () => {
    for (const state of [paused, exploring]) {
      const transition = run(state, { type: 'EXIT' });

      expect(transition.state.screen).toBe('menu');
      expect(transition.effects).toEqual([{ type: 'release-pointer-lock' }]);
    }
  });

  it('activa el modo compatible si falla el pointer lock', () => {
    const transition = run(exploring, {
      type: 'FALLBACK_LOOK',
      message: 'sin lock',
    });

    expect(transition.state.look).toBe('fallback');
    expect(transition.state.error).toBe('sin lock');
  });

  it('ignora eventos inválidos sin cambiar de estado', () => {
    expect(run(exploring, { type: 'ENTER' }).state).toBe(exploring);
    expect(run(menu, { type: 'INTERACT' }).state).toBe(menu);
    expect(run(menu, { type: 'CLOSE_READING' }).state).toBe(menu);
    expect(run(reading, { type: 'PAUSE' }).state).toBe(reading);
  });

  it('pausa al perder el foco de la ventana', () => {
    const transition = run(exploring, { type: 'WINDOW_BLUR' });

    expect(transition.state.screen).toBe('paused');
    expect(transition.effects).toEqual([{ type: 'release-pointer-lock' }]);
  });

  it('mantiene el cursor libre en lectura y pausa', () => {
    expect(run(exploring, { type: 'INTERACT' }).state.look).toBe('free');
    expect(run(exploring, { type: 'PAUSE' }).state.look).toBe('free');
  });
});

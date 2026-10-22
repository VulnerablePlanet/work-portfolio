import { useSessionStore } from '@/store/useSessionStore';

export function SessionNotice() {
  const screen = useSessionStore((state) => state.screen);
  const error = useSessionStore((state) => state.error);
  const dispatch = useSessionStore((state) => state.dispatch);

  if (!error || screen !== 'exploring') {
    return null;
  }

  return (
    <aside className="session-notice" role="status">
      <p>{error}</p>
      <div className="session-notice__actions">
        <button
          type="button"
          onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
        >
          Entendido
        </button>
        <button type="button" onClick={() => dispatch({ type: 'EXIT' })}>
          Volver al menú
        </button>
      </div>
    </aside>
  );
}

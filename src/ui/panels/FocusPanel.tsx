import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useSessionStore } from '@/store/useSessionStore';
import { useInteractionStore } from '@/store/useInteractionStore';

export function FocusPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const activeContent = useInteractionStore((state) => state.activeContent);
  const finishCloseActiveObject = useInteractionStore(
    (state) => state.finishCloseActiveObject,
  );

  useLayoutEffect(() => {
    if (!activeContent || !panelRef.current) {
      return;
    }

    gsap.fromTo(
      panelRef.current,
      {
        autoAlpha: 0,
        y: 18,
        scale: 0.98,
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.32,
        ease: 'power3.out',
      },
    );
  }, [activeContent]);

  if (!activeContent) {
    return null;
  }

  const handleClose = () => {
    finishCloseActiveObject();
    useSessionStore.getState().dispatch({ type: 'CLOSE_READING' });
  };

  return (
    <section ref={panelRef} className="focus-panel" aria-live="polite">
      <p className="focus-panel__eyebrow">{activeContent.eyebrow}</p>
      <h2>{activeContent.title}</h2>
      <p>{activeContent.body}</p>
      {activeContent.links && activeContent.links.length > 0 ? (
        <ul className="focus-panel__links">
          {activeContent.links.map((link) => (
            <li key={`${link.label}:${link.href}`}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="focus-panel__hint">
        Presiona ESC o usa el botón para volver.
      </p>
      <button type="button" onClick={handleClose}>
        Volver a explorar
      </button>
    </section>
  );
}

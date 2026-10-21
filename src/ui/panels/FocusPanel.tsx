import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useInteractionStore } from '@/store/useInteractionStore';

export function FocusPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const activeContent = useInteractionStore((state) => state.activeContent);
  const isPanelClosing = useInteractionStore((state) => state.isPanelClosing);
  const beginCloseActiveObject = useInteractionStore(
    (state) => state.beginCloseActiveObject,
  );
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

  useLayoutEffect(() => {
    if (!isPanelClosing || !panelRef.current) {
      return;
    }

    gsap.to(panelRef.current, {
      autoAlpha: 0,
      y: 18,
      scale: 0.98,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: finishCloseActiveObject,
    });
  }, [finishCloseActiveObject, isPanelClosing]);

  if (!activeContent) {
    return null;
  }

  return (
    <section ref={panelRef} className="focus-panel" aria-live="polite">
      <p className="focus-panel__eyebrow">{activeContent.eyebrow}</p>
      <h2>{activeContent.title}</h2>
      <p>{activeContent.body}</p>
      <p className="focus-panel__hint">
        Presiona ESC o usa el botón para volver.
      </p>
      <button type="button" onClick={beginCloseActiveObject}>
        Volver a explorar
      </button>
    </section>
  );
}

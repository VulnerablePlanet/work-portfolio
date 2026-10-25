import { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
    },
  ): string;
  remove(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile]',
    );

    const handleLoad = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile no se inicializó.'));
      }
    };

    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', () => {
      reject(new Error('No se pudo cargar Turnstile.'));
    });
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: setToken,
          'expired-callback': () => setToken(''),
        });
      })
      .catch((error: unknown) => {
        console.warn('[turnstile] no se pudo cargar', error);
      });

    return () => {
      cancelled = true;

      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey]);

  return (
    <div className="turnstile">
      <div ref={containerRef} />
      <input
        type="hidden"
        name="cf-turnstile-response"
        value={token}
        readOnly
      />
    </div>
  );
}

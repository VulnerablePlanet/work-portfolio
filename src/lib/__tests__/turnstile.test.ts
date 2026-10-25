import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from '@/lib/turnstile.server';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verifyTurnstile', () => {
  it('omite la verificación si no hay secreto', async () => {
    await expect(verifyTurnstile(null, undefined)).resolves.toBe(true);
  });

  it('rechaza si hay secreto y no hay token', async () => {
    await expect(verifyTurnstile(null, 'secret')).resolves.toBe(false);
  });

  it('acepta una verificación correcta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    );

    await expect(verifyTurnstile('token', 'secret', '1.2.3.4')).resolves.toBe(
      true,
    );
  });

  it('rechaza una verificación fallida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: false }), { status: 200 }),
      ),
    );

    await expect(verifyTurnstile('token', 'secret')).resolves.toBe(false);
  });

  it('rechaza si el endpoint falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error', { status: 500 })),
    );

    await expect(verifyTurnstile('token', 'secret')).resolves.toBe(false);
  });
});

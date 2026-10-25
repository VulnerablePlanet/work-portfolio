import { describe, expect, it } from 'vitest';
import { getClientIp } from '@/lib/supabase-admin.server';

describe('getClientIp', () => {
  it('prioriza CF-Connecting-IP', () => {
    const request = new Request('https://example.com', {
      headers: {
        'CF-Connecting-IP': '203.0.113.10',
        'X-Forwarded-For': '198.51.100.4, 10.0.0.1',
      },
    });

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it('usa el primer valor de X-Forwarded-For', () => {
    const request = new Request('https://example.com', {
      headers: { 'X-Forwarded-For': '198.51.100.4, 10.0.0.1' },
    });

    expect(getClientIp(request)).toBe('198.51.100.4');
  });

  it('devuelve unknown sin cabeceras', () => {
    expect(getClientIp(new Request('https://example.com'))).toBe('unknown');
  });
});

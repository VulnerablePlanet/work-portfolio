interface TurnstileVerification {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verifica un token de Turnstile en el servidor. Si el secreto no está
 * configurado se omite (modo local sin Turnstile); en producción deben
 * configurarse site key y secret key.
 */
export async function verifyTurnstile(
  token: string | null,
  secret: string | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
  );

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as TurnstileVerification;

  return result.success === true;
}

import type { EmailOtpType } from '@supabase/supabase-js';
import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { createSupabaseServerClient } from '@/lib/supabase.server';

const OTP_TYPES = new Set<EmailOtpType>([
  'magiclink',
  'email',
  'signup',
  'recovery',
  'invite',
  'email_change',
]);

function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/u/demo';
  }

  return value;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = safeNext(url.searchParams.get('next'));

  if (!tokenHash || !type || !OTP_TYPES.has(type as EmailOtpType)) {
    return redirect('/login?error=missing_token');
  }

  const supabase = createSupabaseServerClient(request, context);

  if (!supabase) {
    return redirect('/login?error=config');
  }

  const { error } = await supabase.client.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`, {
      headers: supabase.responseHeaders,
    });
  }

  return redirect(next, { headers: supabase.responseHeaders });
}

export default function AuthConfirmRoute() {
  return (
    <main className="login-page">
      <p>Confirmando acceso…</p>
    </main>
  );
}

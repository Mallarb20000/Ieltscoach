import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = url.searchParams.get('next') ?? '/dashboard';
  const redirectTo = new URL(next.startsWith('/') ? next : '/dashboard', url.origin);

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL('/', url.origin));

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectTo);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(new URL('/login?error=link', url.origin));
}

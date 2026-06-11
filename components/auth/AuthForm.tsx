'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const linkError = searchParams.get('error') === 'link';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Accounts are not available yet on this deployment. You can still use both practice
        modes without signing in.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { display_name: displayName.trim() },
          },
        });
        if (err) throw err;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setAwaitingConfirm(true);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : 'Could not complete the request. Check your connection and try again.';
      console.error('[auth] error:', err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (awaitingConfirm) {
    return (
      <div className="rounded-md border bg-accent/60 p-4 text-sm leading-6 text-accent-foreground">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1">
          We sent a confirmation link to <span className="font-medium">{email.trim()}</span>.
          Open it to activate your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {linkError && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          That sign-in link has expired or was already used. Sign in below to continue.
        </p>
      )}

      {mode === 'signup' && (
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Sita Sharma"
            autoComplete="name"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-1 h-10">
        {submitting
          ? mode === 'signup'
            ? 'Creating account...'
            : 'Signing in...'
          : mode === 'signup'
            ? 'Create account'
            : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create a free account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Sign in — IELTS Writing Coach',
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="animate-rise w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Welcome back
        </p>
        <h1 className="mb-1 mt-2 font-display text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Pick up where you left off — your reports and band score progress are waiting.
        </p>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}

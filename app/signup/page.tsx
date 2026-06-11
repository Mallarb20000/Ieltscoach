import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata: Metadata = {
  title: 'Create account — IELTS Writing Coach',
};

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="animate-rise w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Free account
        </p>
        <h1 className="mb-1 mt-2 font-display text-2xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Save every report, watch your band scores climb, and never lose an essay again.
        </p>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}

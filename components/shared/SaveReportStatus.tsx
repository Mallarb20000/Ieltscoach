'use client';

import Link from 'next/link';

export type SaveState = 'guest' | 'saving' | 'saved' | 'error';

interface Props {
  state: SaveState;
  onRetry: () => void;
}

export function SaveReportStatus({ state, onRetry }: Props) {
  if (state === 'guest') {
    return (
      <div className="rounded-md border border-primary/25 bg-accent/50 p-3.5 text-sm leading-6 print:hidden">
        <span className="font-medium text-accent-foreground">
          This report will disappear when you leave.
        </span>{' '}
        <Link href="/signup" className="font-medium text-primary underline underline-offset-2">
          Create a free account
        </Link>{' '}
        to save it and track your band score progress over time.
      </div>
    );
  }

  if (state === 'saving') {
    return (
      <p className="text-sm text-muted-foreground print:hidden">Saving to your dashboard...</p>
    );
  }

  if (state === 'saved') {
    return (
      <p className="text-sm text-muted-foreground print:hidden">
        Saved to{' '}
        <Link href="/dashboard" className="font-medium text-primary underline underline-offset-2">
          your dashboard
        </Link>
        .
      </p>
    );
  }

  return (
    <p className="text-sm text-destructive print:hidden">
      Could not save this report.{' '}
      <button onClick={onRetry} className="font-medium underline underline-offset-2">
        Try again
      </button>
    </p>
  );
}

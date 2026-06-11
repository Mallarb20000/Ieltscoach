import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <main className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">IELTS Writing Coach</h1>
        <p className="mt-2 text-muted-foreground">
          Step-by-step feedback for IELTS Writing Task 2, built for Nepali students. Every piece
          of feedback quotes your own words — no vague advice.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/guided"
            className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
          >
            <h2 className="font-semibold">Guided Mode</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Build your essay one section at a time — hook, thesis, body paragraphs, conclusion —
              with specific feedback at every step before you move on.
            </p>
            <p className="mt-3 text-sm font-medium">Start a guided session</p>
          </Link>

          <Link
            href="/unguided"
            className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
          >
            <h2 className="font-semibold">Full Essay Analysis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Already have a complete essay? Paste it in for band score estimates and
              paragraph-by-paragraph feedback against the official criteria.
            </p>
            <p className="mt-3 text-sm font-medium">Analyze an essay</p>
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Band scores are AI estimates only, not official IELTS results.
        </p>
      </main>
    </div>
  );
}

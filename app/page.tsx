import Link from 'next/link';

const FACTS = [
  { value: '11', label: 'guided stages' },
  { value: '4', label: 'IELTS criteria' },
  { value: '10', label: 'real exam questions' },
  { value: '3', label: 'feedback rounds per stage' },
];

export default function Home() {
  return (
    <div className="bg-ruled relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-8 hidden w-px bg-destructive/20 sm:block"
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          IELTS Writing Task 2 &middot; Built for Nepal
        </p>

        <h1 className="animate-rise rise-1 mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
          Write your way
          <br />
          to <span className="text-primary italic">Band 7.</span>
        </h1>

        <p className="animate-rise rise-2 mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          A writing coach that builds your essay with you — hook, thesis, body, conclusion —
          and quotes your own words in every piece of feedback. No vague advice, no invented
          praise.
        </p>

        <div className="animate-rise rise-3 mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/guided"
            className="group relative rounded-xl border border-primary/25 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Recommended
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">Guided Mode</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Build your essay one section at a time, with specific feedback at every step
              before you move on.
            </p>
            <p className="mt-4 text-sm font-medium text-primary">
              Start a session
              <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                &rarr;
              </span>
            </p>
          </Link>

          <Link
            href="/unguided"
            className="group rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Have an essay ready?
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold">Full Analysis</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Paste a complete essay for band score estimates and paragraph-by-paragraph
              feedback against the official criteria.
            </p>
            <p className="mt-4 text-sm font-medium">
              Analyze an essay
              <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                &rarr;
              </span>
            </p>
          </Link>
        </div>

        <dl className="animate-rise rise-4 mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t pt-6">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <dt className="sr-only">{fact.label}</dt>
              <dd className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-semibold text-foreground">
                  {fact.value}
                </span>
                <span className="text-xs text-muted-foreground">{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="animate-rise rise-5 mt-10 text-xs text-muted-foreground">
          Band scores are AI estimates only, not official IELTS results.
        </p>
      </main>
    </div>
  );
}

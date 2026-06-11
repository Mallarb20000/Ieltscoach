import Link from 'next/link';

const FACTS = [
  { value: '11', label: 'guided stages' },
  { value: '4', label: 'IELTS criteria' },
  { value: '10', label: 'real exam questions' },
  { value: '3', label: 'feedback rounds per stage' },
];

function PenUnderline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 14"
      className="absolute -bottom-2 left-0 w-full text-destructive/70"
      preserveAspectRatio="none"
    >
      <path
        d="M4 10 C 50 3 95 12 140 6 S 200 5 216 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Decorative product preview: an essay the way the coach marks it
function MarkedEssayPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl border bg-secondary/60" />
      <div className="relative rotate-1 rounded-xl border bg-card p-6 shadow-xl shadow-foreground/5 transition-transform duration-500 hover:rotate-0">
        <div className="absolute -right-4 -top-5 rotate-12 rounded-md border-2 border-primary/50 px-3 py-1.5 text-center shadow-sm">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            Estimate
          </p>
          <p className="font-display text-xl font-bold leading-none text-primary">7.0</p>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Body paragraph 1
        </p>
        <p className="mt-3 font-serif text-[13.5px] leading-7">
          <span className="rounded-sm bg-sky-200/60 px-0.5">
            Studying abroad gives young Nepalis skills that their home market cannot yet teach.
          </span>{' '}
          For example, a nurse trained in Australia returns with clinical standards that lift an
          entire ward.{' '}
          <span className="rounded-sm bg-emerald-100/70 px-0.5 underline decoration-destructive/60 decoration-wavy decoration-2 underline-offset-4">
            This is why mobility benefit the country.
          </span>
        </p>

        <div className="mt-4 rounded-md border border-l-2 border-l-destructive/50 bg-muted/40 p-3">
          <p className="font-serif text-xs italic text-muted-foreground">
            "This is why mobility benefit the country."
          </p>
          <p className="mt-1 text-xs font-medium">
            Subject-verb agreement: "mobility benefits".
          </p>
          <div className="mt-1.5 flex gap-1">
            <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
              Grammatical Range
            </span>
            <span className="rounded-full border border-destructive/40 px-2 py-0.5 text-[10px] text-destructive">
              major
            </span>
          </div>
        </div>

        <p className="mt-3 text-right font-serif text-xs italic text-destructive/70">
          — quoted from your own words
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-ruled relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-8 hidden w-px bg-destructive/20 sm:block"
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="animate-rise text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              IELTS Writing Task 2 &middot; Built for Nepal
            </p>

            <h1 className="animate-rise rise-1 mt-4 font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
              Write your way to{' '}
              <span className="relative inline-block italic text-primary">
                Band 7.
                <PenUnderline />
              </span>
            </h1>

            <p className="animate-rise rise-2 mt-7 max-w-xl text-base leading-7 text-muted-foreground">
              A coach that builds your essay with you — hook, thesis, body, conclusion — and
              quotes your own words in every piece of feedback. No vague advice, no invented
              praise.
            </p>

            <div className="animate-rise rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guided"
                className="group inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
              >
                Start a guided session
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/unguided"
                className="group inline-flex items-center justify-center rounded-lg border bg-card px-6 py-3 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                Analyze a finished essay
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
          </div>

          <div className="animate-rise rise-3 hidden lg:block">
            <MarkedEssayPreview />
          </div>
        </div>

        <p className="animate-rise rise-5 mt-12 text-xs text-muted-foreground">
          Band scores are AI estimates only, not official IELTS results.
        </p>
      </main>
    </div>
  );
}

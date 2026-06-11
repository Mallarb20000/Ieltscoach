import Link from 'next/link';
import { BandMeter } from '@/components/landing/BandMeter';
import { RollingBand } from '@/components/landing/RollingBand';

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
        pathLength={1}
        className="animate-draw"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Hand-drawn Himalayan ridge with a pennant on the summit
function RidgeDivider() {
  return (
    <div aria-hidden className="overflow-hidden text-primary/25">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        fill="none"
        className="h-12 w-full sm:h-16"
      >
        <path
          d="M0 70 L120 52 L210 64 L330 32 L420 58 L540 22 L600 46 L700 14 L760 42 L880 28 L980 56 L1080 44 L1200 62"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <g className="text-destructive/60">
          <line
            x1="700"
            y1="14"
            x2="700"
            y2="2"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path d="M700 2 L712 6 L700 10 Z" fill="currentColor" />
        </g>
      </svg>
    </div>
  );
}

function PaperPlane() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 140 90"
      fill="none"
      className="pointer-events-none absolute right-48 top-1/2 hidden w-28 -translate-y-1/2 text-primary/40 lg:block"
    >
      <path
        d="M6 80 C 36 74 58 48 96 28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 6"
        strokeLinecap="round"
      />
      <path
        d="M100 26 L132 8 L116 36 L109 29 Z M109 29 L112 40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
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
            &ldquo;This is why mobility benefit the country.&rdquo;
          </p>
          <p className="mt-1 text-xs font-medium">
            Subject-verb agreement: &ldquo;mobility benefits&rdquo;.
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
    <div className="relative flex flex-1 flex-col overflow-hidden">
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
              <RollingBand>
                <PenUnderline />
              </RollingBand>
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

      <RidgeDivider />

      <section className="border-t bg-card/60">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="scroll-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              The target
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">
              Seven is a habit, not a miracle.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              Most university offers and visa routes ask for a 7. The coach scores every stage
              against the four official criteria while you write, so the estimate moves with
              your sentences — not after results day.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {CRITERIA.map((criterion) => (
                <li
                  key={criterion}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
          <BandMeter />
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">
            From blank page to marked essay
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="scroll-rise rounded-xl border bg-card p-6 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="scroll-rise relative mt-10 flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-primary/25 bg-accent/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <PaperPlane />
            <div>
              <h3 className="font-display text-lg font-semibold text-accent-foreground">
                Keep every report. Watch your band climb.
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                A free account saves each session to your dashboard and plots your scores over
                time.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Create a free account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-base font-semibold tracking-tight">
              Writing Coach
            </span>
            <span className="h-1 w-1 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Built for Nepal</span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/guided" className="transition-colors hover:text-foreground">
              Guided Mode
            </Link>
            <Link href="/unguided" className="transition-colors hover:text-foreground">
              Full Analysis
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              Create account
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            AI estimates only — not official IELTS results.
          </p>
        </div>
      </footer>
    </div>
  );
}

const CRITERIA = [
  'Task Response',
  'Coherence & Cohesion',
  'Lexical Resource',
  'Grammatical Range',
];

const STEPS = [
  {
    title: 'Build it piece by piece',
    body: 'Start with a real Task 2 question. Write your hook, bridge, thesis, body paragraphs, and conclusion one stage at a time, with feedback before you move on.',
  },
  {
    title: 'Proof in your own words',
    body: 'Every finding quotes your exact sentence — no vague advice, no invented praise. Fix the line it points at and request another round.',
  },
  {
    title: 'Synthesize and track',
    body: 'Assemble the full essay, get band estimates for all four criteria, and save the report to your dashboard to watch your scores climb session by session.',
  },
];

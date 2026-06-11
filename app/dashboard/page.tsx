import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ReportSummarySchema, type ReportSummary } from '@/lib/reports';
import { BandTrend } from '@/components/dashboard/BandTrend';

export const metadata: Metadata = {
  title: 'Dashboard — IELTS Writing Coach',
};

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect('/');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');

  const { data: rows, error } = await supabase
    .from('reports')
    .select('id, mode, topic, word_count, band_overall, bands, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) console.error('[dashboard] reports query error:', error.message);

  const reports: ReportSummary[] = (rows ?? []).flatMap((r) => {
    const parsed = ReportSummarySchema.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });

  const scored = reports.filter(
    (r): r is ReportSummary & { band_overall: number } => r.band_overall !== null
  );
  const best = scored.length > 0 ? Math.max(...scored.map((r) => r.band_overall)) : null;
  const latest = scored[0]?.band_overall ?? null;
  const recent = scored.slice(0, 5);
  const avgRecent =
    recent.length > 0
      ? recent.reduce((sum, r) => sum + r.band_overall, 0) / recent.length
      : null;

  const trendPoints = [...scored]
    .reverse()
    .map((r) => ({ band: r.band_overall, date: shortDate(r.created_at) }));

  const displayName =
    typeof user.user_metadata?.display_name === 'string' &&
    user.user_metadata.display_name.trim() !== ''
      ? user.user_metadata.display_name.trim().split(/\s+/)[0]
      : null;

  const stats = [
    { label: 'Practice sessions', value: String(reports.length) },
    { label: 'Best overall band', value: best !== null ? best.toFixed(1) : '—' },
    { label: 'Latest band', value: latest !== null ? latest.toFixed(1) : '—' },
    { label: 'Average of last 5', value: avgRecent !== null ? avgRecent.toFixed(1) : '—' },
  ];

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-4">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Your progress
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            {displayName ? `Namaste, ${displayName}` : 'Your dashboard'}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Every saved report lives here, with your band scores plotted over time.
          </p>
        </div>

        <div className="animate-rise rise-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        {trendPoints.length >= 2 && (
          <div className="animate-rise rise-2 rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">Band score over time</h2>
              <p className="text-xs text-muted-foreground">Dashed line marks Band 7</p>
            </div>
            <BandTrend points={trendPoints} />
          </div>
        )}

        <div className="animate-rise rise-3 flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">Saved reports</h2>

          {reports.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
              <p className="font-display text-lg font-semibold">No reports yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Finish a guided session or analyze a full essay, and the report will be saved
                here automatically.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/guided"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Start a guided session
                </Link>
                <Link
                  href="/unguided"
                  className="inline-flex items-center justify-center rounded-lg border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
                >
                  Analyze a finished essay
                </Link>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {reports.map((report) => (
                <li key={report.id}>
                  <Link
                    href={`/reports/${report.id}`}
                    className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
                      {report.band_overall !== null ? (
                        <>
                          <span className="font-display text-lg font-semibold leading-none text-primary">
                            {report.band_overall.toFixed(1)}
                          </span>
                          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                            band
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-6">{report.topic}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {report.mode === 'guided' ? 'Guided session' : 'Full analysis'}
                        {' · '}
                        {report.word_count} words
                        {' · '}
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                    <span className="hidden text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ReportRowSchema } from '@/lib/reports';
import { StageFeedbackSchema, FullEssayFeedbackSchema } from '@/lib/validation/schemas';
import { FinalReport } from '@/components/guided/FinalReport';
import { EssayAnalysis } from '@/components/unguided/EssayAnalysis';
import { DeleteReportButton } from '@/components/dashboard/DeleteReportButton';

export const metadata: Metadata = {
  title: 'Report — IELTS Writing Coach',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect('/');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/reports/${id}`);

  const { data: row } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
  if (!row) notFound();

  const parsed = ReportRowSchema.safeParse(row);
  if (!parsed.success) notFound();
  const report = parsed.data;

  const guidedFeedback =
    report.mode === 'guided' ? StageFeedbackSchema.safeParse(report.feedback) : null;
  const unguidedFeedback =
    report.mode === 'unguided' ? FullEssayFeedbackSchema.safeParse(report.feedback) : null;

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 py-2">
        <div className="animate-rise flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to dashboard
          </Link>
          <DeleteReportButton reportId={report.id} />
        </div>

        <div className="animate-rise rise-1 rounded-xl border bg-card p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {report.mode === 'guided' ? 'Guided session' : 'Full analysis'} &middot;{' '}
            {formatDate(report.created_at)}
          </p>
          <p className="mt-2 font-serif text-[15px] leading-7">{report.topic}</p>
        </div>

        {report.mode === 'guided' && guidedFeedback?.success && (
          <FinalReport
            topic={report.topic}
            draft={report.essay}
            sections={report.sections ?? []}
            feedback={guidedFeedback.data}
          />
        )}

        {report.mode === 'unguided' && unguidedFeedback?.success && (
          <>
            <div className="animate-rise rise-2 rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-2 font-display text-lg font-semibold">Your Essay</h2>
              <p className="whitespace-pre-wrap font-serif text-[15px] leading-8">
                {report.essay}
              </p>
            </div>
            <EssayAnalysis result={unguidedFeedback.data} />
          </>
        )}

        {!guidedFeedback?.success && !unguidedFeedback?.success && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              The feedback for this report could not be displayed, but your essay is below.
            </p>
            <p className="mt-4 whitespace-pre-wrap font-serif text-[15px] leading-8">
              {report.essay}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

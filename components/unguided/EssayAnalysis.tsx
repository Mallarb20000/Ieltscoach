import { Badge } from '@/components/ui/badge';
import type { FullEssayFeedback, Finding } from '@/lib/llm/adapter';

const criterionLabels: Record<Finding['rubricCriterion'], string> = {
  TR: 'Task Response',
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range',
};

export function EssayAnalysis({ result }: { result: FullEssayFeedback }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-rise rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
        <h2 className="mb-4 font-display text-lg font-semibold">Band Score Estimates</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['TR', 'CC', 'LR', 'GRA'] as const).map((criterion) => (
            <div key={criterion} className="rounded-lg border p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">{criterion}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {result.bands[criterion].toFixed(1)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-primary p-4 text-center text-primary-foreground">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">
            Overall Estimate
          </p>
          <p className="mt-1 font-display text-4xl font-semibold">
            {result.bands.overall.toFixed(1)}
          </p>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These are AI estimates only — not official IELTS scores. Verify with a qualified
          examiner.
        </p>
      </div>

      {result.topImprovements.length > 0 && (
        <div className="animate-rise rise-1 rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
          <h2 className="mb-3 font-display text-lg font-semibold">Top Improvements</h2>
          <ol className="flex flex-col gap-2">
            {result.topImprovements.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="animate-rise rise-2 rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
        <h2 className="mb-4 font-display text-lg font-semibold">Paragraph Feedback</h2>
        <div className="flex flex-col gap-6">
          {result.paragraphFeedback.map((pf, i) => (
            <div key={i}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Paragraph {i + 1}
              </p>
              <p className="mb-2.5 rounded-md border-l-2 border-l-primary/30 bg-muted/40 p-3 font-serif text-sm leading-7">
                {pf.paragraph}
              </p>
              {pf.findings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No issues found.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {pf.findings.map((f, j) => (
                    <div
                      key={j}
                      className={`rounded-md border border-l-2 bg-muted/30 p-3 text-sm ${
                        f.severity === 'major' ? 'border-l-destructive/50' : 'border-l-primary/30'
                      }`}
                    >
                      <p className="mb-1 font-serif italic text-muted-foreground">
                        &ldquo;{f.evidenceQuote}&rdquo;
                      </p>
                      <p className="font-medium">{f.issue}</p>
                      <p className="mt-0.5 text-muted-foreground">{f.suggestion}</p>
                      <div className="mt-2 flex gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {criterionLabels[f.rubricCriterion]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${f.severity === 'major' ? 'border-red-300 text-red-700' : 'border-gray-300'}`}
                        >
                          {f.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Verify any statistics or claims in suggestions before applying them.
        </p>
      </div>
    </div>
  );
}

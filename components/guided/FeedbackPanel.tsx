import { Badge } from '@/components/ui/badge';
import type { StageFeedback, Finding } from '@/lib/llm/adapter';

interface Props {
  feedback: StageFeedback;
  userText: string;
}

const ratingConfig = {
  strong: { label: 'Strong', className: 'bg-green-100 text-green-800 border-green-200' },
  okay: { label: 'Okay', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  needs_improvement: {
    label: 'Needs Improvement',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
} satisfies Record<string, { label: string; className: string }>;

const criterionLabels: Record<Finding['rubricCriterion'], string> = {
  TR: 'Task Response',
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range',
};

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div
      className={`rounded-md border border-l-2 bg-muted/30 p-3 text-sm ${
        finding.severity === 'major' ? 'border-l-destructive/50' : 'border-l-primary/30'
      }`}
    >
      <p className="mb-1 font-serif italic text-muted-foreground">"{finding.evidenceQuote}"</p>
      <p className="font-medium">{finding.issue}</p>
      <p className="mt-0.5 text-muted-foreground">{finding.suggestion}</p>
      <div className="mt-2 flex gap-1.5">
        <Badge variant="outline" className="text-xs">
          {criterionLabels[finding.rubricCriterion]}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs ${finding.severity === 'major' ? 'border-red-300 text-red-700' : 'border-gray-300'}`}
        >
          {finding.severity}
        </Badge>
      </div>
    </div>
  );
}

export function FeedbackPanel({ feedback }: Props) {
  const { label, className } = ratingConfig[feedback.rating];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-0 print:p-0 print:shadow-none">
      <div className="mb-4 flex items-center gap-3">
        <h3 className="font-display text-lg font-semibold">Feedback</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
          {label}
        </span>
        {feedback.meta.targetWordCount && (
          <span className="ml-auto text-xs text-muted-foreground">
            {feedback.meta.wordCount} words &middot; target {feedback.meta.targetWordCount.min}–
            {feedback.meta.targetWordCount.max}
          </span>
        )}
      </div>

      <p className="mb-4 text-sm">{feedback.summary}</p>

      {feedback.findings.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {feedback.findings.map((f, i) => (
            <FindingCard key={i} finding={f} />
          ))}
        </div>
      )}

      {feedback.rewriteExample && (
        <details className="group mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary transition-colors hover:text-primary/80">
            Rewrite example
          </summary>
          <div className="mt-2 rounded-md border border-primary/20 bg-accent/40 p-3 font-serif text-sm italic leading-6">
            {feedback.rewriteExample}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Verify any statistics or claims before using this example.
          </p>
        </details>
      )}
    </div>
  );
}
